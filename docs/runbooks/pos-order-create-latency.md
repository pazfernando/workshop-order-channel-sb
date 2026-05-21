# POS order create latency

## Impact

La creacion de ordenes tarda mas de lo esperado y afecta la experiencia del cajero.

## Revision rapida

1. Revisar p95/p99 de `pos_order_create_duration`.
2. Separar latencia del endpoint local `/api/pos/orders` y del upstream `POST /orders`.
3. Buscar trazas lentas y revisar spans de API Gateway/Lambda.
4. Verificar saturacion JVM, CPU y memoria en la aplicacion POS.
5. Confirmar que no exista degradacion regional en AWS `us-east-1`.

## Mitigacion

- Reintentar contra un ambiente alterno solo si el proceso de negocio lo permite.
- Escalar al owner de la API de ordenes cuando el span upstream domina la latencia.
- Revisar timeouts si la latencia deriva en errores al cajero.
