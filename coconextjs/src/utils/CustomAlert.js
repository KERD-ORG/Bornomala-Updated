import React, { useState, useEffect } from 'react';

const CustomAlert = ({ message, dismissable = true, timer = null, onClose, type }) => {
    const [show, setShow] = useState(true);

    useEffect(() => {
        if (timer) {
            const timeoutId = setTimeout(() => {
                setShow(false);
                if (onClose) onClose();
            }, timer);

            return () => clearTimeout(timeoutId);
        }
    }, [timer, onClose]);

    const handleClose = () => {
        setShow(false);
        if (onClose) onClose();
    };

    const alertClass = `alert alert-${type} alert-dismissible fade ${show ? 'show' : ''}`;

    return (
        <div className={alertClass} role="alert">
            {dismissable && <button type="button" className="btn-close" aria-label="Close" onClick={handleClose}></button>}
            <strong>{message}</strong>
        </div>
    );
};

export default CustomAlert;
