import React from 'react';

interface LogResult {
    id: string;
    message: string;
    timestamp: string;
}

interface LogsResultsProps {
    logs: LogResult[];
}

const LogsResults: React.FC<LogsResultsProps> = ({ logs }) => {
    const groupedLogs = logs.reduce<Record<string, LogResult[]>>((acc, log) => {
        const date = new Date(log.timestamp).toLocaleDateString();
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(log);
        return acc;
    }, {});

    return (
        <div>
            {Object.entries(groupedLogs).map(([date, logs]) => (
                <div key={date}>
                    <h2>{date}</h2>
                    <ul>
                        {logs.map(log => (
                            <li key={log.id}>
                                <strong>{log.timestamp}</strong>: {log.message}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default LogsResults;