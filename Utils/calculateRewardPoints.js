const calculateRewardPoints = (reservations) => {
  // Define starting point and maximum points
  const startingPoint = 5;
  const maximumPoints = 1000;

  // Calculate total reservations
  const totalReservations = reservations.length;

  // Check if the user meets the starting point requirement
  if (totalReservations < startingPoint) {
    return 0; // No points earned if starting point requirement is not met
  }

  // Calculate points based on total reservations
  let totalPoints = Math.min(totalReservations, maximumPoints);

  return totalPoints;
};

module.exports = calculateRewardPoints;
