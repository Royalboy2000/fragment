export interface UsernameNFT {
  id: string;
  username: string;
  priceTON: number;
  priceUSD: number;
  status: 'Auction' | 'Sold' | 'On Sale';
  timeLeft?: string;
  highestBid?: number;
}
