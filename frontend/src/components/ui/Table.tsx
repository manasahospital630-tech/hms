import React from 'react';

interface Column { key: string; label: string; render?: (value: any, row: any) => React.ReactNode; }
interface TableProps { columns: Column[]; data: any[]; onRowClick?: (row: any) => void; emptyMessage?: string; }

export const Table: React.FC<TableProps> = ({ columns, data, onRowClick, emptyMessage = 'No records found.' }) => (
  <div className="table-container">
    <table>
      <thead>
        <tr>{columns.map((col) => <th key={col.key}>{col.label}</th>)}</tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px' }}><div className="empty-state"><p>{emptyMessage}</p></div></td></tr>
        ) : (
          data.map((row, i) => (
            <tr key={row.id || row.patient_id || row.appointment_id || row.encounter_id || row.invoice_id || row.item_id || row.user_id || i}
                className={onRowClick ? 'clickable' : ''} onClick={() => onRowClick?.(row)}>
              {columns.map((col) => (
                <td key={col.key}>{col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
