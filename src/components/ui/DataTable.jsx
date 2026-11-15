import styles from './DataTable.module.css'

export function DataTable({ columns, rows, foot = null }) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {columns.map((column) => <td key={column.key}>{row[column.key]}</td>)}
            </tr>
          ))}
        </tbody>
        {foot ? (
          <tfoot>
            <tr>
              {columns.map((column) => <td key={column.key}>{foot[column.key]}</td>)}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  )
}
