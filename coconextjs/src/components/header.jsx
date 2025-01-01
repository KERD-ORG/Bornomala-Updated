import React from 'react';
import { isLoggedIn, logout, getToken } from '../utils/auth';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react'
import { i18n, useTranslation } from 'next-i18next';



function Navheader() {

    const [userLoggedIn, setUserLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState({ username: '', roles: [] });
    const router = useRouter();
    const { locale } = router;
    const { t } = useTranslation('common');
    const changeLanguage = (language) => {
        router.push(router.pathname, router.asPath, { locale: language });
    };

    const localizedPath = (path) => {
        return locale === router.defaultLocale ? path : `/${locale}${path}`;
    };

    useEffect(() => {
        const checkLoggedIn = isLoggedIn();
        setUserLoggedIn(checkLoggedIn);

        if (checkLoggedIn) {
            const token = getToken();
            fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${process.env.NEXT_PUBLIC_API_ENDPOINT_USER_INFO}`, {
                method: 'GET',
                headers: new Headers({
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch user info');
                    }
                    return response.json();
                })
                .then(data => {
                    setUserInfo({ username: data.first_name + ' ' + data.last_name, roles: data.roles });
                })
                .catch(error => {
                    console.error('Error fetching user info:', error);
                });
        }
    }, []);


    const handleLogout = async (event) => {
        event.preventDefault();
        const token = getToken();

        if (!token) {
            console.log('No active session or token expired');
            performClientSideLogout();
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/logout/`, {
                method: 'POST',
                headers: new Headers({
                    'Authorization': `Token ${token}`,
                }),
            });

            if (!response.ok) {
                throw new Error('Logout failed');
            }

            performClientSideLogout();
        } catch (error) {
            console.error(error.message);
            performClientSideLogout();
        }
    };

    function performClientSideLogout() {
        logout(); // Clears any client-side session information
        setUserLoggedIn(false);
        router.push('/signin'); // Redirect to the login page or home page
    }


    useEffect(() => {
        setUserLoggedIn(isLoggedIn());
    }, []);


    return (
        <nav
            className="layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme"
            id="layout-navbar"
        >
            <div className="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0   d-xl-none ">
                <a className="nav-item nav-link px-0 me-xl-4" href="#">
                    <i className="bx bx-menu bx-sm" />
                </a>
            </div>
            <div
                className="navbar-nav-right d-flex align-items-center"
                id="navbar-collapse"
            >

                <div className="navbar-nav align-items-center">
                    <div className="nav-item navbar-search-wrapper mb-0">
                        <a
                            className="nav-item nav-link search-toggler px-0"
                            href="#;"
                        >
                            <i className="bx bx-search bx-sm" />
                            <span className="d-none d-md-inline-block text-muted">
                                Search (Ctrl+/)
                            </span>
                        </a>
                    </div>
                </div>

                <ul className="navbar-nav flex-row align-items-center ms-auto">

                    <li className="nav-item dropdown-language dropdown me-2 me-xl-0">
                        <a
                            className="nav-link dropdown-toggle hide-arrow"
                            href="#;"
                            data-bs-toggle="dropdown"
                        >
                            <i className="bx bx-globe bx-sm" />
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end">
                            <li onClick=

                                {() => changeLanguage('en')
                                }

                            ><a className="dropdown-item" href="#">{t('English')}</a></li>
                            <li onClick=

                                {() => changeLanguage('bn')
                                }

                            ><a className="dropdown-item" href="#">{t('Bengali')}</a></li>
                            <li onClick=

                                {() => changeLanguage('fr')
                                }

                            ><a className="dropdown-item" href="#">{t('French')}</a></li>
                        </ul>
                    </li>


                    <li style={{ display: "none" }} className="nav-item dropdown-notifications navbar-dropdown dropdown me-3 me-xl-1">
                        <a
                            className="nav-link dropdown-toggle hide-arrow"
                            href="#;"
                            data-bs-toggle="dropdown"
                            data-bs-auto-close="outside"
                            aria-expanded="false"
                        >
                            <i className="bx bx-bell bx-sm" />
                            <span className="badge bg-danger rounded-pill badge-notifications">
                                5
                            </span>
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end py-0">
                            <li className="dropdown-menu-header border-bottom">
                                <div className="dropdown-header d-flex align-items-center py-3">
                                    <h5 className="text-body mb-0 me-auto">{t('Notification')}</h5>
                                    <a
                                        href="#"
                                        className="dropdown-notifications-all text-body"
                                        data-bs-toggle="tooltip"
                                        data-bs-placement="top"
                                        title="Mark all as read"
                                    >
                                        <i className="bx fs-4 bx-envelope-open" />
                                    </a>
                                </div>
                            </li>
                            <li className="dropdown-notifications-list scrollable-container">
                                <ul className="list-group list-group-flush">
                                    <li className="list-group-item list-group-item-action dropdown-notifications-item">
                                        <div className="d-flex">
                                            <div className="flex-shrink-0 me-3">
                                                <div className="avatar">
                                                    <img
                                                        src="../../assets/img/avatars/1.png"
                                                        alt=""
                                                        className="w-px-40 h-auto rounded-circle"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-grow-1">
                                                <h6 className="mb-1">Congratulation Lettie 🎉</h6>
                                                <p className="mb-0">
                                                    Won the monthly best seller gold badge
                                                </p>
                                                <small className="text-muted">1h ago</small>
                                            </div>
                                            <div className="flex-shrink-0 dropdown-notifications-actions">
                                                <a
                                                    href="#"
                                                    className="dropdown-notifications-read"
                                                >
                                                    <span className="badge badge-dot" />
                                                </a>
                                                <a
                                                    href="#"
                                                    className="dropdown-notifications-archive"
                                                >
                                                    <span className="bx bx-x" />
                                                </a>
                                            </div>
                                        </div>
                                    </li>
                                    <li className="list-group-item list-group-item-action dropdown-notifications-item">
                                        <div className="d-flex">
                                            <div className="flex-shrink-0 me-3">
                                                <div className="avatar">
                                                    <span className="avatar-initial rounded-circle bg-label-danger">
                                                        CF
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1">
                                                <h6 className="mb-1">Charles Franklin</h6>
                                                <p className="mb-0">Accepted your connection</p>
                                                <small className="text-muted">12hr ago</small>
                                            </div>
                                            <div className="flex-shrink-0 dropdown-notifications-actions">
                                                <a
                                                    href="#"
                                                    className="dropdown-notifications-read"
                                                >
                                                    <span className="badge badge-dot" />
                                                </a>
                                                <a
                                                    href="#"
                                                    className="dropdown-notifications-archive"
                                                >
                                                    <span className="bx bx-x" />
                                                </a>
                                            </div>
                                        </div>
                                    </li>
                                    <li className="list-group-item list-group-item-action dropdown-notifications-item marked-as-read">
                                        <div className="d-flex">
                                            <div className="flex-shrink-0 me-3">
                                                <div className="avatar">
                                                    <img
                                                        src="../../assets/img/avatars/2.png"
                                                        alt=""
                                                        className="w-px-40 h-auto rounded-circle"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-grow-1">
                                                <h6 className="mb-1">New Message ✉️</h6>
                                                <p className="mb-0">
                                                    You have new message from Natalie
                                                </p>
                                                <small className="text-muted">1h ago</small>
                                            </div>
                                            <div className="flex-shrink-0 dropdown-notifications-actions">
                                                <a
                                                    href="#"
                                                    className="dropdown-notifications-read"
                                                >
                                                    <span className="badge badge-dot" />
                                                </a>
                                                <a
                                                    href="#"
                                                    className="dropdown-notifications-archive"
                                                >
                                                    <span className="bx bx-x" />
                                                </a>
                                            </div>
                                        </div>
                                    </li>




                                </ul>
                            </li>
                            <li className="dropdown-menu-footer border-top p-3">
                                <button className="btn btn-primary text-uppercase w-100">
                                    {t('View All Notifications')}
                                </button>
                            </li>
                        </ul>
                    </li>



                    <li className="nav-item navbar-dropdown dropdown-user dropdown">
                        <a
                            className="nav-link dropdown-toggle hide-arrow"
                            href="#;"
                            data-bs-toggle="dropdown"
                        >
                            <div className="avatar avatar-online">
                                <img
                                    src={`https://avatar.iran.liara.run/username?username=${encodeURIComponent(userInfo.username)}`}
                                    alt=""
                                    className="w-px-40 h-auto rounded-circle"
                                />
                            </div>
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                                <a
                                    className="dropdown-item"
                                    href="pages-account-settings-account.html"
                                >
                                    <div className="d-flex">
                                        <div className="flex-shrink-0 me-3">
                                            <div className="avatar avatar-online">
                                                <img
                                                    src={`https://avatar.iran.liara.run/username?username=${encodeURIComponent(userInfo.username)}`}
                                                    alt=""
                                                    className="w-px-40 h-auto rounded-circle"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <span className="fw-medium d-block">
                                                {userInfo.username}
                                            </span>
                                            <small className="text-muted">
                                                {userInfo.roles.join(', ')}
                                            </small>
                                        </div>
                                    </div>
                                </a>
                            </li>
                            <li>
                                <div className="dropdown-divider" />
                            </li>
                            <li>
                                <a className="dropdown-item" href={localizedPath(`${process.env.NEXT_PUBLIC_URL_PROFILE}`)}>
                                    <i className="bx bx-user me-2" />
                                    <span className="align-middle">{t('My Profile')}</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    className="dropdown-item"
                                    href={localizedPath(`${process.env.NEXT_PUBLIC_URL_SETTINGS}`)}
                                >
                                    <i className="bx bx-cog me-2" />
                                    <span className="align-middle">{t('Settings')}</span>
                                </a>
                            </li>



                            <li>
                                <div className="dropdown-divider" />
                            </li>
                            <li>
                                <a className="dropdown-item" href="" onClick=
                                    {handleLogout}
                                >
                                    <i className="bx bx-power-off me-2" />
                                    <span className="align-middle">{t('Log Out')}</span>
                                </a>
                            </li>
                        </ul>
                    </li>

                </ul>
            </div>

            <div className="navbar-search-wrapper search-input-wrapper  d-none">
                <input
                    type="text"
                    className="form-control search-input container-xxl border-0"
                    placeholder="Search..."
                    aria-label="Search..."
                />
                <i className="bx bx-x bx-sm search-toggler cursor-pointer" />
            </div>
        </nav>
    );
}

export default Navheader;
