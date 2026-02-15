import React from 'react';
import { Link } from '@tanstack/react-router';
import { RxExclamationTriangle } from 'react-icons/rx';

export const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-4 p-8 text-center">
      <RxExclamationTriangle className="w-16 h-16 text-yellow-500" />
      <h1 className="text-2xl font-bold italic">Comic Not Found</h1>
      <p className="text-gray-600 dark:text-gray-400 max-w-md">
        The comic you are looking for might have been moved, deleted, or is not in our database.
      </p>
      <Link
        to="/library"
        search={{ path: '' } as any}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Back to Library
      </Link>
    </div>
  );
};
