const User = require("../models/User");

/**
 * Find nearest online service providers
 * Priority:
 * 1. Nearest
 * 2. Online
 */
const findProviders = async (customerLocation, serviceType = null) => {
  if (!customerLocation) return [];

  const pipeline = [
    {
      $geoNear: {
        near: customerLocation,
        distanceField: "distance",
        spherical: true
      }
    },
    {
      $match: {
        role: "provider",
        isOnline: true
      }
    }
  ];

  // Optional service filtering
  if (serviceType) {
    pipeline.push({
      $match: { serviceType }
    });
  }

  return await User.aggregate(pipeline);
};

module.exports = findProviders;
