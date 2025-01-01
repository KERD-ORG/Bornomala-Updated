// commonImports.js
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { getToken } from '../utils/auth';
import { executeAjaxOperation, executeAjaxOperationStandard } from '../utils/fetcher';
import { profileTabOrder } from '../utils/tabConfig';
import PrevNextButtons from '../utils/PrevNextButtons';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import CreatableSelect from 'react-select/creatable';
import { useTranslation } from 'next-i18next';
import { useForm, useFieldArray } from 'react-hook-form'; // Add useForm import
import { yupResolver } from '@hookform/resolvers/yup'; // Add yupResolver import
import * as yup from 'yup'; // Add yup import
import Loader from '../components/Loader';
import CustomAlert  from '../utils/CustomAlert';
import { useUserPermissions } from "../contexts/UserPermissionsContext";
import Swal from 'sweetalert2';
import CommonModal from '../components/CommonModal';
import { Controller } from 'react-hook-form';
import PhoneInput from 'react-phone-input-2';
import { Tooltip } from 'react-tooltip';
import { format } from 'date-fns';
export {
    React,
    useRef,
    useState,
    useCallback,
    useEffect,
    useRouter,
    axios,
    getToken,
    executeAjaxOperation,
    executeAjaxOperationStandard,
    profileTabOrder,
    PrevNextButtons,
    AsyncSelect,
    Select,
    CreatableSelect,
    useTranslation,
    useForm,
    useFieldArray,
    yupResolver,
    yup,
    Loader,
    CustomAlert,
    useUserPermissions,
    Swal,
    CommonModal,
    Controller,
    PhoneInput,
    Tooltip,
    format
};
