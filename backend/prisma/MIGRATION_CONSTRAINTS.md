# PostgreSQL CHECK constraints for the initial migration

Prisma ORM 7.10.1 does not express PostgreSQL `CHECK` constraints in `schema.prisma`. When an initial migration is authorized, add the following SQL to its generated `migration.sql` before applying it. This file is documentation only and must not be run directly.

```sql
ALTER TABLE "Product"
  ADD CONSTRAINT "Product_basePrice_nonnegative"
  CHECK ("basePrice" >= 0);

ALTER TABLE "ProductVariant"
  ADD CONSTRAINT "ProductVariant_priceOverride_nonnegative"
  CHECK ("priceOverride" IS NULL OR "priceOverride" >= 0),
  ADD CONSTRAINT "ProductVariant_stockQuantity_nonnegative"
  CHECK ("stockQuantity" >= 0);

ALTER TABLE "StockMovement"
  ADD CONSTRAINT "StockMovement_quantityChange_nonzero"
  CHECK ("quantityChange" <> 0),
  ADD CONSTRAINT "StockMovement_stockBefore_nonnegative"
  CHECK ("stockBefore" >= 0),
  ADD CONSTRAINT "StockMovement_stockAfter_nonnegative"
  CHECK ("stockAfter" >= 0),
  ADD CONSTRAINT "StockMovement_stockAfter_matches_change"
  CHECK ("stockAfter" = "stockBefore" + "quantityChange"),
  ADD CONSTRAINT "StockMovement_type_matches_change"
  CHECK (
    ("type" = 'INCREASE' AND "quantityChange" > 0) OR
    ("type" = 'DECREASE' AND "quantityChange" < 0) OR
    ("type" = 'CORRECTION' AND "quantityChange" <> 0)
  );
```

## Atomic stock update pattern

The stock service should update the variant and insert its movement in one Prisma interactive transaction. Use a conditional atomic update (for example, `updateManyAndReturn` with `stockQuantity >= requested decrease` for decreases), derive `stockBefore` from the returned `stockQuantity` and signed change, then insert `StockMovement` in that same transaction. The conditional database update serializes competing updates to the same row; if a decrease finds no matching row, reject it as insufficient stock. Any movement insert failure rolls back the stock update. The PostgreSQL checks above remain the final guard against invalid data.
