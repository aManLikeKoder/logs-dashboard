import { useState, useEffect } from 'react';

function useLogSearch(logs, query) {
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [groupedLogs, setGroupedLogs] = useState({});

    useEffect(() => {
        if (query) {
            const searchResults = logs.filter(log => 
                log.message.includes(query) || 
                log.level.includes(query)
            );
            setFilteredLogs(searchResults);
        } else {
            setFilteredLogs(logs);
        }
    }, [logs, query]);

    useEffect(() => {
        const groups = filteredLogs.reduce((acc, log) => {
            const dateKey = new Date(log.timestamp).toDateString();
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(log);
            return acc;
        }, {});
        setGroupedLogs(groups);
    }, [filteredLogs]);

    return { filteredLogs, groupedLogs };
}

export default useLogSearch;