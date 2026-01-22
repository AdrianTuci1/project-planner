import React from 'react';
import './Loading.css';

export const Loading: React.FC = () => {
    return (
        <div className="loading-container">
            <div className="spinner-wrapper">
                <div className="spinner-outer"></div>
                <div className="spinner-inner"></div>
            </div>
            <div className="loading-text">Loading</div>
        </div>
    );
};
