# Workshop Order Channel POS

Aplicacion demo de Punto de Venta para una tienda fisica. El cajero usa una pantalla web con catalogo, carrito, totales, IVA y busqueda de ordenes. El backend Spring Boot consume la API de ordenes expuesta por API Gateway.

## Funcionalidad

- UI POS con Thymeleaf y Bootstrap.
- Catalogo predefinido: Laptop, Mouse, Teclado, Monitor, USB y Cable HDMI.
- Carrito editable con cantidades, eliminacion de lineas, subtotal, IVA 19% y total.
- Creacion de ordenes via `POST /orders` en `https://z410yhtm4c.execute-api.us-east-1.amazonaws.com`.
- Consulta de ordenes via `GET /orders/{orderId}`.
- Panel de ultimas 5 ordenes de la sesion del navegador.
- Actuator, metricas Micrometer y trazas configuradas para OTLP/CloudWatch.
- Contrato de observabilidad para IDP en `contracts/observability/pos.observability.yaml`.

## Ejecutar

```bash
mvn spring-boot:run
```

Luego abrir:

```text
http://localhost:8080/
```

La URL del API externo puede sobreescribirse con:

```bash
ORDER_API_BASE_URL=https://z410yhtm4c.execute-api.us-east-1.amazonaws.com mvn spring-boot:run
```

## Endpoints locales

- `GET /` - pantalla POS.
- `POST /api/pos/orders` - proxy local para crear orden.
- `GET /api/pos/orders/{orderId}` - proxy local para consultar orden.
- `GET /actuator/health` - health check.
- `GET /actuator/metrics` - metricas disponibles.

## Contratos

- OpenAPI consumido: `src/main/resources/openapi/order-api.yaml`.
- Contrato de observabilidad IDP: `contracts/observability/pos.observability.yaml`.
- Descriptor tipo Backstage: `catalog-info.yaml`.

## Workflows

- `CI`: valida el contrato de observabilidad contra `workshop-idp-o11y` y ejecuta `mvn -B verify`.
- `Deploy`: genera un contrato efectivo segun `export_strategy`, consume el IDP de observabilidad, compila la aplicacion, construye la imagen Docker, la publica en ECR y despliega el servicio en Amazon ECS Express Mode.
- `Teardown`: valida el prefijo y la confirmacion del despliegue, y elimina el servicio Amazon ECS Express Mode con `aws ecs delete-express-gateway-service`.

Los workflows de despliegue y teardown usan siempre un prefijo. Debe enviarse como input `resource_prefix`; si no se envia, usan `aws-dev-1`.

El nombre efectivo del servicio ECS Express Mode queda en el formato:

```text
<resource_prefix>-workshop-order-channel-pos
```

El workflow de despliegue espera estas variables de repositorio o ambiente:

- `AWS_ACCOUNT_ID`: cuenta AWS objetivo.
- `AWS_REGION`: region AWS, con fallback `us-east-1`.
- `ECS_TASK_EXECUTION_ROLE_ARN`: rol de ejecucion ECS. Si no se define, usa `arn:aws:iam::<AWS_ACCOUNT_ID>:role/ecsTaskExecutionRole`.
- `ECS_INFRASTRUCTURE_ROLE_ARN`: rol de infraestructura ECS Express Mode. Si no se define, usa `arn:aws:iam::<AWS_ACCOUNT_ID>:role/ecsInfrastructureRoleForExpressServices`.
- `ECS_TASK_ROLE_ARN`: rol de tarea opcional. Si no se define, reutiliza el rol de ejecucion.
- `ECS_CLUSTER`: cluster ECS opcional. Si no se define, usa `default`.

El ambiente `aws-dev` debe tener estos secretos para autenticar el runner:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN`

Inputs principales de despliegue:

- `resource_prefix`: prefijo de servicio, repositorio ECR, logs y tags. Default `aws-dev-1`.
- `log_retention_in_days`: retencion del log group CloudWatch. Default `1`.
- `export_strategy`: `collector` o `direct`. Default `collector`.
- `collector_endpoint`, `collector_traces_endpoint`, `collector_metrics_endpoint`: endpoints OTLP opcionales cuando `export_strategy=collector`.
