import React from 'react'

export default function ResponsiveTable({ columns = [], data = [], rowKey = 'id' }) {
  return (
    <div>
      {/* Desktop / tablet: regular table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              {columns.map(col => (
                <th key={col.header} className={`text-left px-4 py-3 text-xs font-medium text-gray-500 ${col.thClass || ''}`}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map(row => (
              <tr key={row[rowKey]} className="hover:bg-gray-50">
                {columns.map(col => (
                  <td key={col.header} className={`px-4 py-3 align-top ${col.tdClass || ''}`}>
                    {col.cell ? col.cell(row) : (row[col.accessor] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-3">
        {data.map(row => (
          <div key={row[rowKey]} className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
            {columns.map(col => (
              <div key={col.header} className="flex justify-between gap-4 py-1 border-b last:border-b-0">
                <div className="text-xs text-gray-500 w-1/2">{col.header}</div>
                <div className={`text-sm text-right w-1/2 ${col.tdClass || ''}`}>
                  {col.cell ? col.cell(row) : (row[col.accessor] ?? '—')}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
