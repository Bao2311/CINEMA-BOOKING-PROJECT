import styled, { keyframes, css, createGlobalStyle } from 'styled-components';
import { motion } from 'framer-motion';

export const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background-color: #0B0F19;
    color: #ffffff;
    overflow-x: hidden;
  }
  * { box-sizing: border-box; }
  :root {
    --primary: #E50914;
    --primary-hover: #DC2626;
    --secondary: #10B981;
    --accent: #E50914;
    --dark: #ffffff;
    --light: #161D2F;
    --gray: #9CA3AF;
    --text: #ffffff;
    --text-light: #9CA3AF;
    --border-color: rgba(255, 255, 255, 0.1);
  }
`;

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const pulse = keyframes`0% { box-shadow: 0 0 0 0 rgba(229, 9, 20, 0.5); } 70% { box-shadow: 0 0 0 12px rgba(229, 9, 20, 0); } 100% { box-shadow: 0 0 0 0 rgba(229, 9, 20, 0); }`;
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

export const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #0B0F19;
  color: #ffffff;
`;

export const BookingHeader = styled.header`
  background: #161D2F;
  padding: 1.2rem 1.5rem;
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
`;

export const HeaderContent = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const Logo = styled.div<{ $small?: boolean }>`
  font-size: ${props => props.$small ? '1.3rem' : '1.8rem'};
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

export const MovieTitle = styled.h1`
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: #ffffff;
`;

export const BookingSection = styled.section`
  flex: 1;
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1rem 3rem;
  width: 100%;
`;

export const MovieInfoCard = styled.div`
  width: 100%;
  max-width: 1200px;
  background: #161D2F;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  margin-bottom: 2rem;
  overflow: hidden;
  transition: transform 0.3s ease;
  &:hover { transform: translateY(-2px); }
`;

export const MovieInfoContent = styled.div`
  display: flex;
  padding: 1.5rem;
  align-items: center;
  @media (max-width: 768px) { flex-direction: column; text-align: center; }
`;

export const MoviePoster = styled.img`
  width: 110px;
  height: 160px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  @media (max-width: 768px) { width: 100px; height: 150px; margin-bottom: 1rem; }
`;

export const MovieDetails = styled.div`
  padding-left: 2rem;
  flex: 1;
  h2 {
    margin: 0 0 0.8rem;
    color: #ffffff;
    font-size: 1.6rem;
    font-weight: 800;
  }
  @media (max-width: 768px) { padding-left: 0; }
`;

export const MovieMetaInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  @media (max-width: 768px) { justify-content: center; }
`;

export const MetaItem = styled.div`
  font-size: 0.9rem;
  color: #e5e7eb;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.3rem 0.8rem;
  border-radius: 8px;
`;

export const MetaLabel = styled.span`
  color: var(--text-light);
  margin-right: 0.3rem;
  font-weight: 500;
`;

export const CinemaContainer = styled.div`
  background: #161D2F;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  padding: 2.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  perspective: 1200px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 350px;
  width: 100%;
`;

export const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid rgba(229, 9, 20, 0.2);
  border-radius: 50%;
  border-top-color: var(--primary);
  animation: ${spin} 0.8s ease-in-out infinite;
  margin-bottom: 1.2rem;
`;

export const LoadingText = styled.div`
  color: var(--text-light);
  font-size: 1rem;
  font-weight: 500;
`;

export const Screen = styled.div`
  width: 80%;
  height: 40px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(200, 220, 255, 0.6) 40%, rgba(99, 102, 241, 0.05) 100%);
  border-radius: 12px;
  margin-bottom: 3.5rem;
  transform: rotateX(-35deg);
  box-shadow: 0 12px 35px rgba(229, 9, 20, 0.25), 0 0 25px rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.4);
  &:after {
    content: '';
    position: absolute;
    bottom: -25px;
    left: 5%;
    width: 90%;
    height: 25px;
    background: linear-gradient(to bottom, rgba(229, 9, 20, 0.15), transparent);
  }
`;

export const ScreenText = styled.div`
  color: #0B0F19;
  font-weight: 900;
  font-size: 0.85rem;
  letter-spacing: 4px;
  text-transform: uppercase;
`;

export const SeatingArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  justify-content: center;
  align-items: center;
  overflow-x: auto;
  padding: 0.5rem;
`;

export const RowContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  width: 100%;
`;

export const RowLabel = styled.div`
  width: 35px;
  text-align: center;
  font-weight: 700;
  color: var(--text-light);
  font-size: 0.95rem;
`;

export const SectionContainer = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const SeatsSection = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
`;

export const Aisle = styled.div`
  width: 14px;
`;

export const SeatContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  position: relative;
`;

export const SeatNumber = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
`;

export const SeatPrice = styled.div`
  font-size: 0.6rem;
  opacity: 0.9;
`;

export const CheckMark = styled.div`
  font-size: 1.1rem;
  position: absolute;
`;

export const SeatButton = styled(motion.button)<{ $isBooked: boolean; $isSelected: boolean; $seatType: string; $seatSize?: string }>`
  width: 36px;
  height: 36px;
  border-radius: 8px 8px 4px 4px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: ${props =>
    props.$isBooked
      ? '#374151'
      : props.$isSelected
      ? '#10B981'
      : props.$seatType === 'vip'
      ? '#E50914'
      : '#2563EB'};
  color: white;
  font-weight: 700;
  cursor: ${props => props.$isBooked ? 'not-allowed' : 'pointer'};
  position: relative;
  transition: all 0.2s ease;
  box-shadow: ${props =>
    props.$isSelected
      ? '0 0 15px rgba(16, 185, 129, 0.6)'
      : props.$seatType === 'vip' && !props.$isBooked
      ? '0 0 10px rgba(229, 9, 20, 0.3)'
      : '0 2px 6px rgba(0, 0, 0, 0.3)'};
  
  &:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.08);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
    z-index: 10;
  }
  &:disabled { opacity: 0.4; }
`;

export const SeatLegend = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 2.5rem;
  flex-wrap: wrap;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.8rem 1.5rem;
  border-radius: 12px;
`;

export const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
  color: #d1d5db;
  font-weight: 500;
`;

export const ColorBox = styled.div<{ $color: string }>`
  width: 16px;
  height: 16px;
  background: ${props => props.$color};
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
`;

export const BookingPanel = styled.div`
  background: #161D2F;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.2rem 1.5rem;
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5);
  position: sticky;
  bottom: 0;
  z-index: 40;
`;

export const BookingPanelContent = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  h3 {
    margin: 0 0 0.4rem;
    color: #ffffff;
    font-size: 1.1rem;
    font-weight: 700;
  }
  @media (max-width: 768px) { flex-direction: column; gap: 1rem; }
`;

export const SelectedSeatsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 40px;
  align-items: center;
`;

export const EmptySelection = styled.div`
  color: var(--text-light);
  font-style: italic;
  font-size: 0.9rem;
`;

export const SeatBadge = styled(motion.div)<{ $seatType: string }>`
  display: flex;
  align-items: center;
  background: ${props => props.$seatType === 'vip' ? 'rgba(229, 9, 20, 0.2)' : 'rgba(37, 99, 235, 0.2)'};
  border: 1px solid ${props => props.$seatType === 'vip' ? '#E50914' : '#2563EB'};
  border-radius: 8px;
  padding: 0.3rem 0.6rem;
  font-weight: 700;
  font-size: 0.85rem;
  color: #ffffff;
`;

export const SeatTypeIndicator = styled.div<{ $seatType: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${props => props.$seatType === 'vip' ? '#E50914' : '#2563EB'};
  color: white;
  font-size: 0.65rem;
  margin-left: 0.4rem;
`;

export const RemoveButton = styled(motion.button)`
  background: none;
  border: none;
  color: var(--text-light);
  font-size: 1.2rem;
  margin-left: 0.4rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  &:hover { color: var(--accent); }
`;

export const BookingSummary = styled.div`
  flex: 1;
`;

export const ActionContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
`;

export const BookButton = styled(motion.button)<{ $disabled?: boolean }>`
  background: ${props => props.$disabled ? '#374151' : 'var(--primary)'};
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0.85rem 2.2rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  box-shadow: ${props => props.$disabled ? 'none' : '0 4px 15px rgba(229, 9, 20, 0.4)'};
  &:hover:not(:disabled) {
    background: var(--primary-hover);
    box-shadow: 0 6px 20px rgba(229, 9, 20, 0.6);
  }
`;

export const ButtonSpinner = styled.div`
  width: 18px;
  height: 18px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: ${spin} 1s linear infinite;
`;

export const StepsIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
`;

export const Step = styled.div<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: ${props => props.$active ? 1 : 0.6};
  transition: opacity 0.3s ease;
`;

export const StepNumber = styled.div<{ $active?: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${props => props.$active ? 'var(--primary)' : '#374151'};
  color: ${props => props.$active ? 'white' : 'var(--text-light)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  border: 2px solid ${props => props.$active ? '#E50914' : 'transparent'};
  ${props => props.$active && css`animation: ${pulse} 2s infinite;`}
`;

export const StepLabel = styled.div`
  font-size: 0.85rem;
  color: var(--text);
  font-weight: 600;
`;

export const StepConnector = styled.div`
  height: 2px;
  width: 80px;
  background: #374151;
  margin: 0 1rem;
  @media (max-width: 768px) { width: 40px; }
`;

export const PaymentContainer = styled.div`
  background: #161D2F;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  padding: 2.5rem;
`;

export const PaymentHeader = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 24px;
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
`;

export const CountdownTimer = styled.div<{ $warning: boolean }>`
  font-size: 0.95rem;
  color: ${props => props.$warning ? '#ff4d4f' : '#10B981'};
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 10px;
  background-color: ${props => props.$warning ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'};
  border: 1px solid ${props => props.$warning ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'};
`;

export const PaymentGrid = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

export const OrderSummary = styled.div`
  width: 100%;
  max-width: 580px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
`;

export const SummaryTitle = styled.h3`
  margin: 0 0 1.5rem;
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: 700;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.8rem;
`;

export const SummaryItem = styled.div<{ $total?: boolean }>`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
  font-weight: ${props => props.$total ? '800' : '500'};
  font-size: ${props => props.$total ? '1.3rem' : '0.95rem'};
  color: ${props => props.$total ? '#F59E0B' : '#d1d5db'};
`;

export const SummaryDivider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 1.2rem 0;
`;

export const SeatTypeSummary = styled.div`
  margin-bottom: 0.6rem;
`;

export const PaymentForm = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
`;

export const FormTitle = styled.h3`
  margin: 0 0 1.8rem;
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: 700;
`;

export const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

export const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
  @media (max-width: 576px) { grid-template-columns: 1fr; }
`;

export const FormLabel = styled.label`
  display: block;
  margin-bottom: 0.6rem;
  color: var(--text-light);
  font-size: 0.9rem;
  font-weight: 500;
`;

export const FormInput = styled.input<{ $error?: boolean }>`
  width: 100%;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid ${props => props.$error ? 'var(--accent)' : 'rgba(255, 255, 255, 0.1)'};
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  &:focus {
    outline: none;
    border-color: var(--primary);
    background: rgba(255, 255, 255, 0.08);
  }
  &::placeholder { color: #6b7280; }
`;

export const ErrorMessage = styled.div`
  color: var(--accent);
  font-size: 0.85rem;
  margin-top: 0.3rem;
`;

export const FormDivider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 1.8rem 0;
`;

export const ConfirmationContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #161D2F;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  padding: 3.5rem 2.5rem;
`;

export const SuccessIcon = styled.div`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: #10B981;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  color: white;
  margin-bottom: 1.5rem;
  box-shadow: 0 0 25px rgba(16, 185, 129, 0.4);
`;

export const ConfirmationTitle = styled.h2`
  margin: 0 0 0.8rem;
  color: #ffffff;
  font-size: 2rem;
  font-weight: 800;
`;

export const ConfirmationText = styled.p`
  text-align: center;
  color: var(--text-light);
  max-width: 550px;
  margin-bottom: 2.5rem;
  font-size: 0.95rem;
`;

export const TicketContainer = styled.div`
  width: 100%;
  max-width: 550px;
  background: #1E2738;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  margin-bottom: 2.5rem;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const TicketHeader = styled.div`
  padding: 1.2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px dashed rgba(255, 255, 255, 0.15);
  background: linear-gradient(90deg, #E50914, #B91C1C);
  color: white;
`;

export const QRCode = styled.div`
  width: 70px;
  height: 70px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  img { width: 100%; height: 100%; object-fit: cover; }
`;

export const TicketBody = styled.div`
  padding: 1.8rem;
`;

export const TicketMovie = styled.h3`
  margin: 0 0 1.5rem;
  font-size: 1.4rem;
  color: #ffffff;
  font-weight: 800;
`;

export const TicketDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1.5rem;
`;

export const TicketDetail = styled.div``;

export const TicketDetailLabel = styled.div`
  color: var(--text-light);
  font-size: 0.85rem;
  margin-bottom: 0.4rem;
  font-weight: 500;
`;

export const TicketDetailValue = styled.div`
  font-weight: 700;
  color: #ffffff;
  font-size: 0.95rem;
`;

export const TicketFooter = styled.div`
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

export const TicketId = styled.div`
  font-size: 0.85rem;
  color: var(--text-light);
  font-weight: 600;
  font-family: monospace;
`;

export const ActionButtons = styled.div`
  display: flex;
  gap: 1.2rem;
  margin-top: 1rem;
  @media (max-width: 500px) { flex-direction: column; }
`;

export const DownloadButton = styled.button`
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0.85rem 2rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(229, 9, 20, 0.4);
  &:hover {
    background: var(--primary-hover);
  }
`;

export const AddToWalletButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 12px;
  padding: 0.85rem 2rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  transition: all 0.2s ease;
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

export const DownloadIcon = styled.span`
  font-size: 1.2rem;
`;

export const WalletIcon = styled.span`
  font-size: 1.2rem;
`;

export const BackButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 12px;
  padding: 0.85rem 1.8rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

export const ConfirmButton = styled.button`
  padding: 0.85rem 2rem;
  border: none;
  border-radius: 12px;
  background: #3b82f6;
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover { background: #2563eb; }
  &:last-child {
    background: #ef4444;
    &:hover { background: #dc2626; }
  }
`;

export const PointsDisplay = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 16px;
  border-radius: 12px;
  margin: 16px 0;
`;

export const PointsText = styled.span`
  color: var(--text-light);
  font-weight: 500;
`;

export const PointsValue = styled.span`
  color: #F59E0B;
  font-weight: 700;
`;

export const PointsInputContainer = styled.div`
  display: flex;
  gap: 10px;
  margin: 14px 0;
  align-items: center;
`;

export const PointsInput = styled.input`
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  flex: 1;
  font-size: 14px;
  color: #ffffff;
  &:focus {
    outline: none;
    border-color: var(--primary);
  }
  &::placeholder { color: #6b7280; }
`;

export const ApplyPointsButton = styled.button<{ disabled?: boolean }>`
  padding: 10px 18px;
  background-color: ${props => props.disabled ? '#374151' : 'var(--primary)'};
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
`;

export const PromotionContainer = styled.div`
  display: flex;
  gap: 10px;
  margin: 14px 0;
  align-items: center;
`;

export const PromotionInput = styled.input`
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  flex: 1;
  font-size: 14px;
  color: #ffffff;
  text-transform: uppercase;
  &:focus {
    outline: none;
    border-color: var(--primary);
  }
  &::placeholder { color: #6b7280; }
`;

export const ApplyPromotionButton = styled.button<{ disabled?: boolean }>`
  padding: 10px 18px;
  background-color: ${props => props.disabled ? '#374151' : 'var(--primary)'};
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
`;

export const RemovePromotionButton = styled.button<{ disabled?: boolean }>`
  padding: 10px 18px;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
`;

export const PriceCalculation = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

export const CalculationItem = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  color: #d1d5db;
`;
