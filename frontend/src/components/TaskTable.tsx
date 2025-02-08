// components/TaskTable.tsx
export function TaskTable({ tasks }: { tasks: Task[] }) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-sm rounded-lg">
          <thead>
            <tr>
              <th className="p-3 bg-gray-50 text-left border">ID</th>
              <th className="p-3 bg-gray-50 text-left border">Title</th>
              <th className="p-3 bg-gray-50 text-left border">Description</th>
              <th className="p-3 bg-gray-50 text-left border">Status</th>
              <th className="p-3 bg-gray-50 text-left border">Priority</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td className="p-3 border">{task.id}</td>
                <td className="p-3 border">{task.title}</td>
                <td className="p-3 border">{task.description}</td>
                <td className={`p-3 border ${task.is_complete ? 'text-green-600' : 'text-red-600'}`}>
                  {task.is_complete ? 'Complete' : 'Incomplete'}
                </td>
                <td className="p-3 border">{task.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }