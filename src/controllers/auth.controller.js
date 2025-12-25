import jwt from 'jsonwebtoken';
import BlacklistedToken from '../models/BlacklistedToken.js';
import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { sendError, sendSuccess } from '../utils/response.js';

export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return sendError(res, 'Un compte existe déjà avec cet email', 409);
    }

    const newUser = await User.create({
      email,
      password,
      firstName,
      lastName
    });

    const token = generateToken(newUser.id);

    return sendSuccess(res, {
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }
    }, 'Compte créé avec succès', 201);
  } catch (error) {
    console.error('Error during registration:', error);
    return sendError(res, 'Erreur serveur lors de l\'inscription', 500);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return sendError(res, 'Email ou mot de passe incorrect', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Email ou mot de passe incorrect', 401);
    }

    const token = generateToken(user.id);

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    }, 'Connexion réussie');
  } catch (error) {
    console.error('Error during login:', error);
    return sendError(res, 'Erreur serveur lors de la connexion', 500);
  }
};

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return sendError(res, 'Invalid token format', 400);
    }

    const expiresAt = new Date(decoded.exp * 1000);

    await BlacklistedToken.create({
      token,
      expiresAt
    });

    return sendSuccess(res, null, 'Déconnexion réussie');
  } catch (error) {
    console.error('Error during logout:', error);
    return sendError(res, 'Erreur serveur', 500);
  }
};
