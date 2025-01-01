import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getToken, logout } from '../utils/auth';

const UserPermissionsContext = createContext();

export const UserPermissionsProvider = ({ children }) => {
    const [permissions, setPermissions] = useState([]); // Existing permissions array
    const [permissionsMap, setPermissionsMap] = useState({ permissionlist: {} }); // New permissions map
    const router = useRouter();

    useEffect(() => {
        const token = getToken(); // Get the token

        if (!token) {
            console.log('No token found, skipping permissions fetch.');
            return;
        }

        const fetchPermissions = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${process.env.NEXT_PUBLIC_API_ENDPOINT_USER_PERMISSIONS}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`, 
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch permissions');
                }

                const data = await response.json();
                setPermissions(data);

                // Create the permissions map based on the fetched data
                const newPermissionsMap = data.reduce((acc, permission) => {
                    acc.permissionlist[permission.codename] = true; // Set to true if permission exists
                    return acc;
                }, { permissionlist: {} });
                
                setPermissionsMap(newPermissionsMap); // Update the permissions map
            } catch (error) {
                console.error('Error fetching user permissions:', error);
                performClientSideLogout();
            }
        };

        fetchPermissions();
    }, []);

    function performClientSideLogout() {
        logout(); 
        router.push('/signin');
    }

    return (
        <UserPermissionsContext.Provider value={{ permissions, permissionsMap }}>
            {children}
        </UserPermissionsContext.Provider>
    );
};

export const useUserPermissions = () => useContext(UserPermissionsContext);
