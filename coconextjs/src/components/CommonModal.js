import React from 'react';
import PropTypes from 'prop-types';

const CommonModal = ({ title, formComponent, showModal, closeModal, size = 'large' }) => {
    // Use the size prop to determine the modal size class
    const modalSizeClass = {
        small: 'modal-sm',
        large: 'modal-lg',
        extraLarge: 'modal-xl',
        default: '', 
    }[size] || 'modal-lg';

    const modalStyle = {
        display: showModal ? 'block' : 'none',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    };

    return (
        <div className={`modal fade ${showModal ? 'show' : ''}`} tabIndex="-1" style={modalStyle}>
            <div className={`modal-dialog ${modalSizeClass}`}>
                <div className="modal-content">
                    <div className="modal-header border-bottom">
                        <h4 className="modal-title">{title}</h4>
                        <button type="button" className="btn-close" onClick={closeModal}></button>
                    </div>
                    <div className="modal-body">
                        {formComponent}
                    </div>
                </div>
            </div>
        </div>
    );
};

CommonModal.propTypes = {
    title: PropTypes.string.isRequired,
    formComponent: PropTypes.element.isRequired,
    showModal: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
    size: PropTypes.oneOf(['default', 'small', 'large', 'extraLarge']),
};

export default CommonModal;