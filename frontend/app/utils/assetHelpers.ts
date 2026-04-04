export const getMountainAsset = () => {
  const hour = new Date().getHours();

  // Mapping based on user request:
  // Morning (5-12) -> Mountain 1
  // Afternoon (12-17) -> Mountain 2
  // Evening (17-20) -> Mountain 3
  // Night (20-5) -> Mountain 4

  if (hour >= 5 && hour < 12) {
    return require('../../assets/images/Mountain1.png');
  } else if (hour >= 12 && hour < 17) {
    return require('../../assets/images/Mountain2.png');
  } else if (hour >= 17 && hour < 20) {
    return require('../../assets/images/Mountain3.png');
  } else {
    return require('../../assets/images/Mountain4.png');
  }
};
