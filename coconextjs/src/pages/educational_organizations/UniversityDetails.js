import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import slugify from 'slugify';

const UniversityDetails = ({ university }) => {
  const { t } = useTranslation();

  if (!university) return null; 

  const defaultThumbnail = process.env.NEXT_PUBLIC_LOGO_DEFAULT_THUMBNAIL
  const imageUrl = university.logo_url ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${university.logo_url}` : defaultThumbnail;

  return (
    <div className="container">
      <div className="row">
        <div className='col-md-6'>
          <ul className="list-group list-group-flush">
            <li className="list-group-item">
              <strong>{t('ID')}:</strong> {university.id}
            </li>
            <li className="list-group-item">
              <strong>{t('Name')}:</strong> {university.name}
            </li>
            <li className="list-group-item">
              <strong>{t('Platform Address')}:</strong> <a href={`${process.env.NEXT_PUBLIC_MAIN_URL}/org/${slugify(university.name, { lower: true })}`} target="_blank" rel="noopener noreferrer">{process.env.NEXT_PUBLIC_MAIN_URL}/org/{slugify(university.name, { lower: true })}</a>
            </li>
            <li className="list-group-item">
              <strong>{t('Category')}:</strong> {university.under_category_name}
            </li>
            <li className="list-group-item">
              <strong>{t('Web Address')}:</strong> <a href={university.web_address} target="_blank" rel="noopener noreferrer">{university.web_address}</a>
            </li>
            <li className="list-group-item">
              <strong>{t('Country')}:</strong> {university.country_name}
            </li>
            <li className="list-group-item">
              <strong>{t('State')}:</strong> {university.state_province_name}
            </li>
            <li className="list-group-item">
              <strong>{t('City')}:</strong> {university.city}
            </li>
            <li className="list-group-item">
              <strong>{t('Address Line 1')}:</strong> {university.address_line1}
            </li>
            <li className="list-group-item">
              <strong>{t('Address Line 2')}:</strong> {university.address_line2}
            </li>
            <li className="list-group-item">
              <strong>{t('Postal Code')}:</strong> {university.postal_code}
            </li>
            <li className="list-group-item">
              <strong>{t('Logo')}:</strong>
              {university.logo_url && (
                <img
                  src={imageUrl}
                  alt="University Logo"
                  style={{ width: '70px', height: 'auto', borderRadius: '2px', marginLeft: '10px' }}
                />
              )}
            </li>
            <li className="list-group-item">
              <strong>{t('Status')}:</strong> <span className={`badge badge-pill ${university.status ? 'bg-success' : 'bg-danger'}`}>{university.status ? t('Active') : t('Inactive')}</span>
            </li>
          </ul>
        </div>

        <div className='col-md-6'>
          <h5> User Information</h5>
          <hr></hr>
          <ul className="list-group list-group-flush">
            <li className="list-group-item">
              <strong>{t('First Name')}:</strong> {university.first_name}
            </li>
            <li className="list-group-item">
              <strong>{t('Middle Name')}:</strong> {university.middle_name}
            </li>
            <li className="list-group-item">
              <strong>{t('Last Name')}:</strong> {university.last_name}
            </li>
            <li className="list-group-item">
              <strong>{t('Email')}:</strong> <a href={`mailto:${university.email}`} target="_blank" rel="noopener noreferrer">{university.email}</a>
            </li>
            
          </ul>
        </div>
      </div>
    </div>
  );
};

UniversityDetails.propTypes = {
  university: PropTypes.object,
};

export default UniversityDetails;
