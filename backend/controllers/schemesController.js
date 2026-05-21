// GOVERNMENT SCHEMES & FINANCIAL LEARNING CONTROLLER
// Implements welfare schema checks, eligibility logic, and financial education data serving.

const db = require('../config/db');

// List all welfare schemes
const getSchemes = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM government_schemes ORDER BY created_at DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get schemes error:', error);
    res.status(500).json({ error: 'Server error. Failed to retrieve welfare schemes.' });
  }
};

// Check scheme eligibility based on user inputs
const checkEligibility = async (req, res) => {
  const { age, organizedSector, taxpayer, monthlyIncome } = req.body;

  if (age === undefined || organizedSector === undefined || taxpayer === undefined) {
    return res.status(400).json({ 
      error: 'Please fill in all details to check eligibility: age, organised sector status, and taxpayer status.' 
    });
  }

  const userAge = parseInt(age);
  const isTaxpayer = !!taxpayer;
  const isOrganized = !!organizedSector;
  const income = parseFloat(monthlyIncome || 0.00);

  try {
    const result = await db.query('SELECT * FROM government_schemes');
    const schemes = result.rows;
    
    // Filter schemes using a matching rule algorithm against eligibility_criteria JSON
    const eligibleSchemes = schemes.filter(scheme => {
      const criteria = scheme.eligibility_criteria || {};
      
      // Check Age Limit
      if (criteria.min_age !== undefined && userAge < criteria.min_age) return false;
      if (criteria.max_age !== undefined && userAge > criteria.max_age) return false;

      // Check Taxpayer constraint
      if (criteria.taxpayer !== undefined && criteria.taxpayer === false && isTaxpayer) return false;

      // Check Organized Sector constraint
      if (criteria.organized_sector !== undefined && criteria.organized_sector === false && isOrganized) return false;

      // Check Income limit
      if (criteria.monthly_income_limit !== undefined && income > criteria.monthly_income_limit) return false;

      return true;
    });

    res.status(200).json({
      eligibleCount: eligibleSchemes.length,
      schemes: eligibleSchemes
    });
  } catch (error) {
    console.error('Check eligibility error:', error);
    res.status(500).json({ error: 'Server error. Failed to compute eligibility results.' });
  }
};

// Get financial learning courses list
const getFinancialLessons = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM financial_learning ORDER BY created_at ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get learning error:', error);
    res.status(500).json({ error: 'Server error. Failed to retrieve financial literacy materials.' });
  }
};

module.exports = {
  getSchemes,
  checkEligibility,
  getFinancialLessons
};
