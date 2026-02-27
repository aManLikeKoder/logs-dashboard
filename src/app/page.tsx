import React from 'react';
import SearchBar from './SearchBar';
import LogsResults from './LogsResults';

const Page: React.FC = () => {
    return (
        <div>
            <h1>Logs Dashboard</h1>
            <SearchBar />
            <LogsResults />
        </div>
    );
};

export default Page;