import styled, { keyframes, css, createGlobalStyle } from 'styled-components';
import { motion } from 'framer-motion';

export const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: 'Poppins', sans-serif; /* Font hiện đại hơn */
    background: linear-gradient(135deg, #f5f5f7 0%, #e0e0e5 100%); /* Gradient nền nhẹ */
    color: #2d2d2d;
    overflow-x: hidden;
  }
  * { box-sizing: border-box; }
  :root {
    --primary: #1e3a8a; /* Màu xanh đậm hơn */
    --primary-hover: #1e40af;
    --secondary: #22c55e; /* Xanh lá tươi sáng */
    --accent: #ef4444;
    --dark: #1f2937;
    --light: #f9fafb;
    --gray: #6b7280;
    --text: #1f2937;
    --text-light: #9ca3af;
    --border-color: #e5e7eb;
  }
`;

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const pulse = keyframes`0% { box-shadow: 0 0 0 0 rgba(30, 58, 138, 0.5); } 70% { box-shadow: 0 0 0 12px rgba(30, 58, 138, 0); } 100% { box-shadow: 0 0 0 0 rgba(30, 58, 138, 0); }`;
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

export const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(0, 0, 0, 0.05));
`;

export const BookingHeader = styled.header`
  background: linear-gradient(90deg, var(--primary), var(--primary-hover));
  padding: 1.5rem;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  font-weight: 600;
`;

export const BookingSection = styled.section`
  flex: 1;
  max-width: 1280px;
  margin: 0 auto;
  padding: 2.5rem 1rem;
  width: 100%;
`;

export const MovieInfoCard = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2.5rem;
  overflow: hidden;
  transition: transform 0.3s ease;
  &:hover { transform: translateY(-5px); }
`;

export const MovieInfoContent = styled.div`
  display: flex;
  padding: 1.5rem;
  @media (max-width: 768px) { flex-direction: column; }
`;

export const MoviePoster = styled.img`
  width: 140px;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  @media (max-width: 768px) { width: 120px; height: 180px; margin-bottom: 1rem; }
`;

export const MovieDetails = styled.div`
  padding-left: 2rem;
  flex: 1;
  h2 {
    margin: 0 0 1rem;
    color: var(--dark);
    font-size: 1.8rem;
    font-weight: 700;
  }
  @media (max-width: 768px) { padding-left: 0; }
`;

export const MovieMetaInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
`;

export const MetaItem = styled.div`
  font-size: 0.95rem;
  color: var(--text);
`;

export const MetaLabel = styled.span`
  color: var(--text-light);
  margin-right: 0.3rem;
  font-weight: 500;
`;

export const CinemaContainer = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  perspective: 1200px;
`;

export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 350px;
`;

export const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid rgba(30, 58, 138, 0.2);
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
  width: 85%;
  height: 50px;
  background: linear-gradient(135deg, #e5e7eb, #d1d5db);
  border-radius: 8px;
  margin-bottom: 3.5rem;
  transform: rotateX(-35deg);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  &:after {
    content: '';
    position: absolute;
    bottom: -25px;
    left: 5%;
    width: 90%;
    height: 25px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.15), transparent);
  }
`;

export const ScreenText = styled.div`
  color: #4b5563;
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: 3px;
  text-transform: uppercase;
`;

export const SeatingArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
  max-width: 1000px;
`;

export const RowContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  margin-bottom: 0.6rem;
`;

export const RowLabel = styled.div`
  width: 35px;
  text-align: center;
  font-weight: 600;
  color: var(--text-light);
  font-size: 1rem;
`;

export const SectionContainer = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
`;

export const SeatsSection = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const Aisle = styled.div`
  width: 40px;
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
  font-size: 0.8rem;
  font-weight: 600;
`;

export const SeatPrice = styled.div`
  font-size: 0.65rem;
  opacity: 0.9;
`;

export const CheckMark = styled.div`
  font-size: 1.2rem;
  position: absolute;
`;

export const SeatButton = styled(motion.button)<{ $isBooked: boolean; $isSelected: boolean; $seatType: string; $seatSize?: string }>`
  width: ${props => props.$seatSize === 'large' ? '42px' : props.$seatSize === 'small' ? '34px' : '38px'};
  height: ${props => props.$seatSize === 'large' ? '42px' : props.$seatSize === 'small' ? '34px' : '38px'};
  border-radius: 8px 8px 0 0;
  border: none;
  background: ${props => props.$isBooked ? '#6b7280' : props.$isSelected ? 'var(--secondary)' : props.$seatType === 'vip' ? '#ef4444' : '#3b82f6'};
  color: white;
  font-weight: 600;
  cursor: ${props => props.$isBooked ? 'not-allowed' : 'pointer'};
  position: relative;
  transition: all 0.25s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  &:after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 100%;
    height: 5px;
    background: ${props => props.$isBooked ? '#4b5563' : props.$isSelected ? '#16a34a' : props.$seatType === 'vip' ? '#b91c1c' : '#1e40af'};
    border-radius: 0 0 5px 5px;
  }
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  &:disabled { opacity: 0.6; }
`;

export const SeatLegend = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 2.5rem;
  flex-wrap: wrap;
`;

export const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
  color: var(--text-light);
  font-weight: 500;
`;

export const ColorBox = styled.div<{ $color: string }>`
  width: 18px;
  height: 18px;
  background: ${props => props.$color};
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

export const BookingPanel = styled.div`
  background: #fff;
  border-top: 1px solid var(--border-color);
  padding: 1.5rem;
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.1);
`;

export const BookingPanelContent = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  h3 {
    margin: 0 0 0.6rem;
    color: var(--dark);
    font-size: 1.1rem;
    font-weight: 600;
  }
  @media (max-width: 768px) { flex-direction: column; gap: 1.5rem; }
`;

export const SelectedSeatsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  min-height: 45px;
`;

export const EmptySelection = styled.div`
  color: var(--text-light);
  font-style: italic;
  padding: 12px 0;
  font-size: 0.95rem;
`;

export const SeatBadge = styled(motion.div)<{ $seatType: string }>`
  display: flex;
  align-items: center;
  background: ${props => props.$seatType === 'premium' ? 'rgba(234, 179, 8, 0.15)' : props.$seatType === 'vip' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)'};
  border: 1px solid ${props => props.$seatType === 'premium' ? '#eab308' : props.$seatType === 'vip' ? '#ef4444' : 'var(--primary)'};
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text);
`;

export const SeatTypeIndicator = styled.div<{ $seatType: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${props => props.$seatType === 'premium' ? '#eab308' : props.$seatType === 'vip' ? '#ef4444' : 'var(--primary)'};
  color: white;
  font-size: 0.65rem;
  margin-left: 0.4rem;
`;

export const RemoveButton = styled(motion.button)`
  background: none;
  border: none;
  color: var(--text-light);
  font-size: 1.3rem;
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
`;

export const BookButton = styled(motion.button)<{ $disabled?: boolean }>`
  background: ${props => props.$disabled ? 'var(--gray)' : 'var(--primary)'};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.9rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  &:hover:not(:disabled) {
    background: var(--primary-hover);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  }
`;

export const ButtonSpinner = styled.div`
  width: 18px;
  height: 18px;
  border: 3px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  border-top-color: white;
  animation: ${spin} 1s linear infinite;
`;

export const StepsIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2.5rem;
`;

export const Step = styled.div<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: ${props => props.$active ? 1 : 0.7};
  transition: opacity 0.3s ease;
`;

export const StepNumber = styled.div<{ $active?: boolean }>`
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: ${props => props.$active ? 'var(--primary)' : '#d1d5db'};
  color: ${props => props.$active ? 'white' : 'var(--text-light)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin-bottom: 0.6rem;
  transition: all 0.3s ease;
  ${props => props.$active && css`animation: ${pulse} 2s infinite;`}
`;

export const StepLabel = styled.div`
  font-size: 0.9rem;
  color: var(--text);
  font-weight: 500;
`;

export const StepConnector = styled.div`
  height: 3px;
  width: 100px;
  background: #d1d5db;
  margin: 0 1.2rem;
  @media (max-width: 768px) { width: 50px; }
`;

export const PaymentContainer = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  padding: 2.5rem;
`;

export const PaymentHeader = styled.h2`
  margin: 0 0 2.5rem;
  color: var(--dark);
  text-align: center;
  font-size: 1.8rem;
  font-weight: 700;
`;

export const PaymentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`;

export const OrderSummary = styled.div`
  background: #f9fafb;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
`;

export const SummaryTitle = styled.h3`
  margin: 0 0 1.8rem;
  color: var(--dark);
  font-size: 1.2rem;
  font-weight: 600;
`;

export const SummaryItem = styled.div<{ $total?: boolean }>`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.9rem;
  font-weight: ${props => props.$total ? '700' : '500'};
  font-size: ${props => props.$total ? '1.2rem' : '0.95rem'};
  color: var(--text);
`;

export const SummaryDivider = styled.div`
  height: 1px;
  background: var(--border-color);
  margin: 1.2rem 0;
`;

export const SeatTypeSummary = styled.div`
  margin-bottom: 0.6rem;
`;

export const PaymentForm = styled.div`
  background: #f9fafb;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
`;

export const FormTitle = styled.h3`
  margin: 0 0 1.8rem;
  color: var(--dark);
  font-size: 1.2rem;
  font-weight: 600;
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
  font-size: 0.95rem;
  font-weight: 500;
`;

export const FormInput = styled.input<{ $error?: boolean }>`
  width: 100%;
  padding: 0.9rem;
  border-radius: 6px;
  border: 1px solid ${props => props.$error ? 'var(--accent)' : 'var(--border-color)'};
  background: #fff;
  color: var(--text);
  font-size: 0.95rem;
  transition: all 0.2s ease;
  &:focus {
    outline: none;
    border-color: ${props => props.$error ? 'var(--accent)' : 'var(--primary)'};
    box-shadow: 0 0 0 4px ${props => props.$error ? 'rgba(239, 68, 68, 0.15)' : 'rgba(30, 58, 138, 0.15)'};
  }
  &::placeholder { color: #9ca3af; }
`;

export const ErrorMessage = styled.div`
  color: var(--accent);
  font-size: 0.85rem;
  margin-top: 0.3rem;
`;

export const FormDivider = styled.div`
  height: 1px;
  background: var(--border-color);
  margin: 1.8rem 0;
`;

export const ConfirmationContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  padding: 3.5rem 2.5rem;
`;

export const SuccessIcon = styled.div`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: var(--secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: white;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

export const ConfirmationTitle = styled.h2`
  margin: 0 0 1.2rem;
  color: var(--dark);
  font-size: 2rem;
  font-weight: 700;
`;

export const ConfirmationText = styled.p`
  text-align: center;
  color: var(--text-light);
  max-width: 550px;
  margin-bottom: 2.5rem;
  font-size: 1rem;
`;

export const TicketContainer = styled.div`
  width: 100%;
  max-width: 550px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  margin-bottom: 2.5rem;
  position: relative;
  border: 1px solid var(--border-color);
  transform: perspective(1000px) rotateX(2deg);
  transition: transform 0.3s ease;
  &:hover { transform: perspective(1000px) rotateX(0deg); }
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%231e3a8a' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
    opacity: 0.6;
  }
`;

export const TicketHeader = styled.div`
  padding: 1.2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px dashed var(--border-color);
  background: linear-gradient(90deg, var(--primary), var(--primary-hover));
  color: white;
`;

export const QRCode = styled.div`
  width: 70px;
  height: 70px;
  background: #fff;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  img { width: 100%; height: 100%; object-fit: cover; }
`;

export const TicketBody = styled.div`
  padding: 2rem;
`;

export const TicketMovie = styled.h3`
  margin: 0 0 1.8rem;
  font-size: 1.5rem;
  color: var(--dark);
  font-weight: 700;
`;

export const TicketDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1.8rem;
`;

export const TicketDetail = styled.div``;

export const TicketDetailLabel = styled.div`
  color: var(--text-light);
  font-size: 0.9rem;
  margin-bottom: 0.6rem;
  font-weight: 500;
`;

export const TicketDetailValue = styled.div`
  font-weight: 600;
  color: var(--text);
  font-size: 1rem;
`;

export const TicketFooter = styled.div`
  padding: 1rem;
  background: #f9fafb;
  text-align: center;
  border-top: 1px solid var(--border-color);
`;

export const TicketId = styled.div`
  font-size: 0.9rem;
  color: var(--text-light);
  font-weight: 500;
`;

export const ActionButtons = styled.div`
  display: flex;
  gap: 1.2rem;
  margin-top: 2.5rem;
  @media (max-width: 500px) { flex-direction: column; }
`;

export const DownloadButton = styled.button`
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.9rem 2rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  transition: all 0.2s ease;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  &:hover {
    background: var(--primary-hover);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  }
`;

export const AddToWalletButton = styled.button`
  background: #1f2937;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.9rem 2rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  transition: all 0.2s ease;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  &:hover {
    background: #374151;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  }
`;

export const DownloadIcon = styled.span`
  font-size: 1.3rem;
`;

export const WalletIcon = styled.span`
  font-size: 1.3rem;
`;

export const BackButton = styled(motion.button)`
  background: #f97316;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.9rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  &:hover {
    background: #ea580c;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  }
`;

export const ConfirmButton = styled.button`
  padding: 0.9rem 2rem;
  border: none;
  border-radius: 6px;
  background: #3b82f6;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  &:hover {
    background: #2563eb;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  }
  &:last-child {
    background: #ef4444;
    &:hover {
      background: #dc2626;
    }
  }
`;

export const PointsDisplay = styled.div`
  background-color: #f6f8ff;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 16px 0;
  border: 1px solid #e6e8f0;
`;

export const PointsText = styled.span`
  color: #4a5568;
  font-weight: 500;
`;

export const PointsValue = styled.span`
  color: #2563eb;
  font-weight: 600;
`;

export const PointsInputContainer = styled.div`
  display: flex;
  gap: 10px;
  margin: 16px 0;
  align-items: center;
`;

export const PointsInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  flex: 1;
  font-size: 14px;
  
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  &[type=number] {
    -moz-appearance: textfield;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

export const ApplyPointsButton = styled.button<{ disabled?: boolean }>`
  padding: 8px 16px;
  background-color: ${props => props.disabled ? '#9ca3af' : '#3b82f6'};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background-color: #2563eb;
  }
`;

export const DiscountNote = styled.div`
  color: #10b981;
  font-size: 14px;
  margin-top: 8px;
  text-align: right;
  font-weight: 500;
`;

export const PromotionContainer = styled.div`
  display: flex;
  gap: 10px;
  margin: 16px 0;
  align-items: center;
`;

export const PromotionInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  flex: 1;
  font-size: 14px;
  text-transform: uppercase;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

export const ApplyPromotionButton = styled.button<{ disabled?: boolean }>`
  padding: 8px 16px;
  background-color: ${props => props.disabled ? '#9ca3af' : '#3b82f6'};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  white-space: nowrap;
  
  &:hover:not(:disabled) {
    background-color: #2563eb;
  }
`;

export const PriceCalculation = styled.div`
  margin-top: 16px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
`;

export const CalculationItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #4b5563;
  font-size: 14px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;