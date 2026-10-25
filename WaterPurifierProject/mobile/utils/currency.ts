export function formatINR(paise: number): string {
  const rupees = Math.round(paise / 100);
  const value = String(rupees);
  const lastThree = value.slice(-3);
  const rest = value.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${lastThree}` : lastThree;
  return `₹${grouped}`;
}
