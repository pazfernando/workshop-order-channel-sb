# POS order create errors

## Impact

El POS no puede crear ordenes o la API externa devuelve errores 5xx/4xx.

## Revision rapida

1. Revisar `/actuator/health` y confirmar que la aplicacion esta lista.
2. Revisar logs con `event=order_create_failure` y correlacionar por `traceId`.
3. Consultar la metrica `pos_order_create_duration` y el ratio de errores HTTP de `/api/pos/orders`.
4. Validar conectividad hacia `https://z410yhtm4c.execute-api.us-east-1.amazonaws.com/orders`.
5. Confirmar que el payload enviado conserva `items`, `subtotal`, `tax`, `total`, `channel`, `pointOfSale` y `sellerName`.

## Mitigacion

- Si API Gateway o Lambda estan fallando, escalar al equipo `team-order-channels`.
- Si el error es de validacion, comparar el payload contra `src/main/resources/openapi/order-api.yaml`.
- Si el problema es de red local, usar `ORDER_API_BASE_URL` para apuntar a un ambiente alterno.
