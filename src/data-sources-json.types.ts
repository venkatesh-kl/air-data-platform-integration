export interface DataSourceListItem {
  success: boolean;
  schema_id: string;
  schema: DataPlatformSchemaDefinition;
  retrieved_at: string;
}

interface SchemaColumn {
  name: string;
  type: string;
  comment: string;
}

interface SchemaMetadata {
  pii_fields?: Array<
    | string
    | {
        field: string;
        original_field: string;
      }
  >;
}

type TableType = "aggregated" | "enriched" | "virtual";

/**
 * Inner `schema` object from the API; fields vary by table kind.
 * Virtual heatmap schemas omit `schema.pii_fields`; enriched permission matrix uses `source_table`.
 */
interface DataPlatformSchemaDefinition {
  schema_id: string;
  product: string;
  table_type: TableType;
  created_at: string;
  columns: SchemaColumn[];
  /** Enriched tables backed by a base table (e.g. permission_matrix_enriched). */
  source_table?: string;
  /** Physical or logical table name (aggregated / virtual). */
  table_name?: string;
  is_partitioned_by_orgid?: boolean;
  /** May be `{}` or include `pii_fields` for aggregated / some enriched schemas. */
  schema?: SchemaMetadata;
}
