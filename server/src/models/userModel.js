// dependencies
import { prisma } from '../lib/db.js';

/**
 * Inserts resident to MWH_User and MWH_Resident tables
 * @param {*} username 
 * @param {*} hashedpassword 
 * @param {*} userRole 
 * @param {*} Date_Of_Birth 
 * @param {*} Date_Of_Admission 
 * @param {*} Last_Abscondence 
 * @returns 
 */
export const insertResident = async (
    username, 
    hashedPassword, 
    userRole, 
    dateOfBirth, 
    dateOfAdmission, 
    lastAbscondence
) => {
    try {
        const result = await prisma.$transaction(async (prisma) => {
            // insert into mwh_user
            const createdUser = await prisma.user.create({
                data: {
                    userName: username,
                    passwordHash: hashedPassword,
                    userRole: userRole,
                }
            });

            // insert into mwh_resident
            const createdResident = await prisma.resident.create({
                data: {
                    userId: createdUser.id,
                    dateOfBirth: dateOfBirth,
                    dateOfAdmission: dateOfAdmission,
                    lastAbscondence: lastAbscondence,
                }
            });

            return createdUser.id
        });

        return result

    } catch (error) {
        if (error.code === 'P2002') {
            throw new Error('Username already exists');
        }
        if (error.code === 'P2003') {
            throw new Error('Foreign key constraint failed');
        }
        
        console.error('Transaction failed:', error);
        
        throw new Error('Failed to create resident account');
    }
}

/**
 * Inserts officer to MWH_User and MWH_Officer tables
 * @param {*} username 
 * @param {*} hashedpassword 
 * @param {*} userRole 
 * @returns 
 */
export const insertOfficer = async (
    username, 
    hashedpassword, 
    userRole, 
    officerEmail
) => {
    try {
        const result = await prisma.$transaction(async (prisma) => {
            // insert into mwh_user
            const createdUser = await prisma.user.create({
                data: {
                    userName: username,
                    passwordHash: hashedpassword,
                    userRole: userRole,
                }
            });

            // insert into mwh_resident
            const createdOfficer = await prisma.officer.create({
                data: {
                    userId: createdUser.id,
                    officerEmail: officerEmail,
                }
            });

            return createdUser.id
        });

        return result;
        
    } catch (error) {
        if (error.code === 'P2002') {
            throw new Error('Username already exists');
        }
        if (error.code === 'P2003') {
            throw new Error('Foreign key constraint failed');
        }
        
        console.error('Transaction failed:', error);
        
        throw new Error('Failed to create resident account');
    }
}

/**
 * Inserts developer to MWH_User table (no linking table for developer role)
 * @param {*} username 
 * @param {*} hashedpassword 
 */
export const insertDeveloper = async (username, hashedPassword, userRole) => {
    const userData = {
        userName: username,
        passwordHash: hashedPassword,
        userRole: userRole,
    }

    const createdUser = await prisma.user.create({ data: userData })

    return createdUser.id
}

/**
 * selects user from MWH_User table based on userid
 * @param {*} userId 
 * @returns 
 */
export const selectUserByUserId = async (userId) => {
    const selectedUser = await prisma.user.findFirst({
        where: {
            id: userId
        },
        select: {
            id: true,
            userName: true,
            passwordHash: true
        }
    })

    if (!selectedUser) {
        return null
    };

    return selectedUser
}

/**
 * selects user from MWH_Officer table based on officer email
 * @param {*} officerEmail 
 * @returns 
 */
export const selectOfficerByOfficerEmail = async (officerEmail) => {
    const selectedOfficer = await prisma.officer.findFirst({
        where: {
            officerEmail: officerEmail
        },
        select: {
            officerEmail: true,
            user: {
                select: {
                    id: true,
                    userName: true,
                    passwordHash: true
                }
            }
        }
    })

    if (!selectedOfficer) {
        return null
    };

    return selectedOfficer
}