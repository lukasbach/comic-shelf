import React from 'react';
import { RxUpdate } from 'react-icons/rx';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-4">
      <RxUpdate className="w-10 h-10 animate-spin text-blue-500" />
      <span className="text-lg font-medium text-gray-600 dark:text-gray-300">Loading comic...</span>
    </div>
  );
};
