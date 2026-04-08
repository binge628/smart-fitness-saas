/**
 * SQL 动态更新构建器
 * 用于生成动态 UPDATE 语句，消除重复的参数拼接逻辑
 */

export interface UpdateQueryResult {
  query: string;
  values: any[];
}

/**
 * 构建动态 UPDATE 语句
 * @param tableName 表名
 * @param data 要更新的字段对象
 * @param whereClause WHERE 条件（如 'id = $1'）
 * @param whereValues WHERE 条件的值数组
 * @param returningFields 返回的字段，默认 '*'
 * @returns 包含 query 和 values 的对象
 */
export function buildUpdateQuery(
  tableName: string,
  data: Record<string, any>,
  whereClause: string,
  whereValues: any[],
  returningFields: string = '*'
): UpdateQueryResult {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  // 遍历数据对象，构建 SET 子句
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  // 如果没有要更新的字段，返回空
  if (updates.length === 0) {
    return { query: '', values: [] };
  }

  // 添加 updated_at 时间戳
  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  // 构建 WHERE 条件的参数索引
  const whereParamStart = paramIndex;
  const whereParams = whereValues.map((val, idx) => `$${whereParamStart + idx}`);
  const whereClauseWithParams = whereClause.replace(/\$(\d+)/g, (_, num) => {
    const idx = parseInt(num) - 1;
    return whereParams[idx] || `$${whereParamStart + idx}`;
  });

  // 构建完整查询
  const query = `
    UPDATE ${tableName}
    SET ${updates.join(', ')}
    WHERE ${whereClauseWithParams}
    RETURNING ${returningFields}
  `;

  return {
    query,
    values: [...values, ...whereValues],
  };
}

/**
 * 构建动态 INSERT 语句
 * @param tableName 表名
 * @param data 要插入的字段对象
 * @param returningFields 返回的字段，默认 '*'
 * @returns 包含 query 和 values 的对象
 */
export function buildInsertQuery(
  tableName: string,
  data: Record<string, any>,
  returningFields: string = '*'
): UpdateQueryResult {
  const fields: string[] = [];
  const placeholders: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(key);
      placeholders.push(`$${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) {
    return { query: '', values: [] };
  }

  const query = `
    INSERT INTO ${tableName} (${fields.join(', ')})
    VALUES (${placeholders.join(', ')})
    RETURNING ${returningFields}
  `;

  return { query, values };
}

/**
 * 构建动态 SELECT 查询
 * @param tableName 表名
 * @param conditions WHERE 条件对象
 * @param options 可选参数（orderBy, limit, offset, join 等）
 * @returns 包含 query 和 values 的对象
 */
export function buildSelectQuery(
  tableName: string,
  conditions: Record<string, any> = {},
  options: {
    fields?: string;
    orderBy?: string;
    limit?: number;
    offset?: number;
    join?: string;
  } = {}
): UpdateQueryResult {
  const values: any[] = [];
  let paramIndex = 1;
  const whereClauses: string[] = [];

  for (const [key, value] of Object.entries(conditions)) {
    if (value !== undefined && value !== null) {
      whereClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  let query = `SELECT ${options.fields || '*'} FROM ${tableName}`;

  if (options.join) {
    query += ` ${options.join}`;
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  if (options.orderBy) {
    query += ` ORDER BY ${options.orderBy}`;
  }

  if (options.limit !== undefined) {
    query += ` LIMIT $${paramIndex}`;
    values.push(options.limit);
    paramIndex++;
  }

  if (options.offset !== undefined) {
    query += ` OFFSET $${paramIndex}`;
    values.push(options.offset);
  }

  return { query, values };
}