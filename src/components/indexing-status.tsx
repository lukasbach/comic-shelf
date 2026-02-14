import React, { useState } from 'react';
import { useIndexing } from '../contexts/indexing-context';
import { RxReload, RxExclamationTriangle, RxCheckCircled, RxCross2 } from 'react-icons/rx';

export const IndexingStatus: React.FC = () => {
    const { isIndexing, progress, startIndexing, lastIndexedAt, errors, clearErrors } = useIndexing();
    const [showErrors, setShowErrors] = useState(false);

    if (!isIndexing && errors.length === 0) {
        return (
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 flex items-center justify-between">
                <span>
                    {lastIndexedAt 
                        ? `Last indexed: ${new Date(lastIndexedAt).toLocaleTimeString()}` 
                        : 'Never indexed'}
                </span>
                <button 
                    onClick={startIndexing}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
                    title="Re-index library"
                >
                    <RxReload className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    {isIndexing ? (
                        <RxReload className="w-3.5 h-3.5 animate-spin text-blue-500" />
                    ) : errors.length > 0 ? (
                        <RxExclamationTriangle className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                        <RxCheckCircled className="w-3.5 h-3.5 text-green-500" />
                    )}
                    <span>{isIndexing ? 'Indexing Library...' : 'Indexing Finished'}</span>
                </div>
                {!isIndexing && errors.length > 0 && (
                    <button 
                        onClick={startIndexing}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                        <RxReload className="w-3 h-3" />
                    </button>
                )}
            </div>

            {isIndexing && progress && (
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-gray-500">
                        <span className="truncate max-w-30">{progress.currentPath || 'Scanning...'}</span>
                        <span>{progress.current}/{progress.total}</span>
                    </div>
                    <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ 
                                width: `${progress.total ? (progress.current! / progress.total * 100) : 0}%` 
                            }}
                        />
                    </div>
                </div>
            )}

            {errors.length > 0 && (
                <div className="space-y-1">
                    <button 
                        onClick={() => setShowErrors(!showErrors)}
                        className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 hover:underline"
                    >
                        <RxExclamationTriangle className="w-3 h-3" />
                        {errors.length} error{errors.length > 1 ? 's' : ''} occurred
                    </button>
                    
                    {showErrors && (
                        <div className="mt-2 max-h-40 overflow-y-auto border border-amber-200 dark:border-amber-900/50 rounded p-2 bg-amber-50 dark:bg-amber-950/30 space-y-2">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200">Errors</span>
                                <button 
                                    onClick={clearErrors} 
                                    className="p-0.5 hover:bg-amber-200 dark:hover:bg-amber-900 rounded"
                                    title="Clear errors"
                                >
                                    <RxCross2 className="w-2.5 h-2.5" />
                                </button>
                            </div>
                            {errors.map((error, idx) => (
                                <div key={idx} className="text-[10px] space-y-0.5 border-b border-amber-100 dark:border-amber-900/30 pb-1 last:border-0">
                                    <div className="font-medium text-amber-800 dark:text-amber-200 truncate" title={error.path}>
                                        {error.path.split(/[\\/]/).pop()}
                                    </div>
                                    <div className="text-amber-600 dark:text-amber-400 leading-tight">
                                        {error.message}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
