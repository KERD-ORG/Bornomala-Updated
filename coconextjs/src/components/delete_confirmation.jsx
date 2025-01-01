import { Modal, Button } from 'react-bootstrap';
import { React,  useTranslation, } from '../utils/commonImports';
 
const DeleteConfirmation = ({t, show, handleClose, handleConfirm, message }) => {
    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>{t('Confirm Deletion')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{message}</Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    {t('Cancel')}
                </Button>
                <Button variant="danger" onClick={handleConfirm}>
                    {t('Delete')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DeleteConfirmation;
