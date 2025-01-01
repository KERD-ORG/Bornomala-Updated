// src/components/Loader.jsx
import React from 'react';

const Loader = () => {
    return (
        <div className="loader">
            <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
            <style jsx>{`
                .loader {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background-color: rgba(255, 255, 255, 0.8);
                    z-index: 9999;
                }
            `}</style>
        </div>
    );
};

export default Loader;


