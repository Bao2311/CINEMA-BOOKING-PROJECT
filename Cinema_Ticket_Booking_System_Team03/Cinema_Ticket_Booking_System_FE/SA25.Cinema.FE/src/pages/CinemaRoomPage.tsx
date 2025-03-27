import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import styled, { keyframes, css, createGlobalStyle } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced types for our cinema room
interface SeatType {
  id: string;
  row: string;
  number: number;
  price: number;
  isBooked: boolean;
  seatType: 'standard' | 'premium' | 'vip';
  section: 'left' | 'center' | 'right';
}

interface MovieDetails {
  movie_ID: number;
  movie_Name: string;
  release_Date: string;
  end_Date: string;
  production_Company: string;
  director: string;
  cast: string;
  duration: number;
  genre: string;
  rating: string;
  language: string;
  country: string;
  synopsis: string;
  poster_URL: string;
  trailer_Link: string;
  status: string;
  created_By: number;
  created_At: string;
  updated_At: string;
}

interface ShowtimeDetails {
  showtime_ID: number;
  movie_ID: number;
  cinema_Room_ID: number;
  room_Name: string;
  show_Date: string;
  start_Time: string;
  end_Time: string;
  price_Tier: string;
  base_Price: number;
  status: string;
}

// Seat Layout API Response Types (from ManageCinemaRoomPage)
interface Seat {
  layout_ID: number;
  row_Label: string;
  column_Number: number;
  seat_Type: string;
  is_Active: boolean;
}

interface Row {
  row: string;
  seats: { $values: Seat[] };
}

interface SeatLayout {
  cinema_room: {
    cinema_Room_ID: number;
    room_Name: string;
    room_Type: string;
  };
  rows: { $values: Row[] };
  dimensions: { rows: number; columns: number };
  stats: {
    total_seats: number;
    seat_types: { $values: { seatType: string; count: number }[] };
  };
}

// New API Response Types for Seat Status
interface SeatStatus {
  seat_ID: number;
  seat: null;
  row_Name: string;
  seat_Number: number;
  seat_Type: string;
  price: number;
  seat_Status: 'Available' | 'Reserved' | 'Unavailable';
  layout_ID: number;
}

interface SeatStatusResponse {
  showtime_ID: number;
  seats: { $values: SeatStatus[] };
}

// Global styles matching CinemaPlus theme
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: 'Roboto', sans-serif;
    background-color: #f5f5f7;
    color: #333;
    overflow-x: hidden;
  }
 
  * {
    box-sizing: border-box;
  }
 
  :root {
    --primary: #2e3192; /* CinemaPlus primary blue */
    --primary-hover: #252a7a;
    --secondary: #28a745; /* Green for action buttons */
    --accent: #dc3545; /* Red accent */
    --dark: #333;
    --light: #f5f5f7;
    --gray: #6c757d;
    --text: #333;
    --text-light: #6c757d;
    --border-color: #dee2e6;
  }
`;

// Animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(46, 49, 146, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(46, 49, 146, 0); }
  100% { box-shadow: 0 0 0 0 rgba(46, 49, 146, 0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Styled components for the cinema room
const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const BookingHeader = styled.header`
  background-color: var(--primary);
  padding: 1rem;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled.div<{ small?: boolean }>`
  font-size: ${props => props.small ? '1.2rem' : '1.5rem'};
  font-weight: bold;
  letter-spacing: 1px;
  color: white;
`;

const MovieTitle = styled.h1`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 500;
`;

const BookingSection = styled.section`
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  width: 100%;
`;

const MovieInfoCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  overflow: hidden;
`;

const MovieInfoContent = styled.div`
  display: flex;
  padding: 1rem;
 
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const MoviePoster = styled.img`
  width: 120px;
  height: 180px;
  object-fit: cover;
  border-radius: 4px;
 
  @media (max-width: 768px) {
    width: 100px;
    height: 150px;
    margin-bottom: 1rem;
  }
`;

const MovieDetails = styled.div`
  padding-left: 1.5rem;
  flex: 1;
 
  h2 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: var(--dark);
  }
 
  @media (max-width: 768px) {
    padding-left: 0;
  }
`;

const MovieMetaInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const MetaItem = styled.div`
  font-size: 0.9rem;
  color: var(--text);
`;

const MetaLabel = styled.span`
  color: var(--text-light);
  margin-right: 0.25rem;
`;

const CinemaContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  perspective: 1000px;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(46, 49, 146, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary);
  animation: ${spin} 1s linear infinite;
  margin-bottom: 1rem;
`;

const LoadingText = styled.div`
  color: var(--text-light);
`;

const Screen = styled.div`
  width: 80%;
  height: 40px;
  background: linear-gradient(to bottom, #d1d1d1, #f5f5f5);
  border-radius: 5px;
  margin-bottom: 3rem;
  transform: rotateX(-30deg);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
 
  &:after {
    content: '';
    position: absolute;
    bottom: -20px;
    left: 10%;
    width: 80%;
    height: 20px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), transparent);
  }
`;

const ScreenText = styled.div`
  color: #555;
  font-weight: bold;
  font-size: 0.8rem;
  letter-spacing: 2px;
`;

const SeatingArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  max-width: 900px;
`;

const RowContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const RowLabel = styled.div`
  width: 30px;
  text-align: center;
  font-weight: bold;
  color: var(--text-light);
  font-size: 0.9rem;
`;

const SectionContainer = styled.div`
  display: flex;
  flex: 1;
  justify-content: space-between;
`;

const SeatsSection = styled.div`
  display: flex;
  gap: 0.4rem;
`;

const Aisle = styled.div`
  width: 30px;
`;

const SeatContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  position: relative;
`;

const SeatNumber = styled.div`
  font-size: 0.7rem;
  font-weight: bold;
`;

const SeatPrice = styled.div`
  font-size: 0.6rem;
  opacity: 0.8;
`;

const CheckMark = styled.div`
  font-size: 1rem;
  position: absolute;
`;

const SeatButton = styled(motion.button)<{
  isBooked: boolean;
  isSelected: boolean;
  seatType: string;
  seatSize?: string;
}>`
  width: ${props => {
    switch(props.seatSize) {
      case 'large': return '38px';
      case 'small': return '32px';
      default: return '35px';
    }
  }};
  height: ${props => {
    switch(props.seatSize) {
      case 'large': return '38px';
      case 'small': return '32px';
      default: return '35px';
    }
  }};
  border-radius: 6px 6px 0 0;
  border: none;
  background-color: ${props => {
    if (props.isBooked) return '#6c757d'; // Gray for inactive seats
    if (props.isSelected) return 'var(--secondary)'; // Green for selected
    switch(props.seatType) {
      case 'vip': return '#ef4444'; // Red for VIP
      case 'standard': return '#3b82f6'; // Blue for Regular
      default: return '#3b82f6'; // Default to blue
    }
  }};
  color: white;
  font-weight: bold;
  cursor: ${props => props.isBooked ? 'not-allowed' : 'pointer'};
  position: relative;
  transition: all 0.2s ease;
 
  &:after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 100%;
    height: 4px;
    background-color: ${props => {
      if (props.isBooked) return '#5a5a5a';
      if (props.isSelected) return '#1c7430';
      switch(props.seatType) {
        case 'vip': return '#bd2130';
        case 'standard': return '#252a7a';
        default: return '#252a7a';
      }
    }};
    border-radius: 0 0 4px 4px;
  }
 
  &:disabled {
    opacity: 0.7;
  }
`;

const SeatLegend = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-light);
`;

const ColorBox = styled.div<{ color: string }>`
  width: 15px;
  height: 15px;
  background-color: ${props => props.color};
  border-radius: 3px;
`;

const BookingPanel = styled.div`
  background-color: white;
  border-top: 1px solid var(--border-color);
  padding: 1rem;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
`;

const BookingPanelContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
 
  h3 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    color: var(--dark);
    font-size: 1rem;
  }
 
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const SelectedSeatsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 40px;
`;

const EmptySelection = styled.div`
  color: var(--text-light);
  font-style: italic;
  padding: 10px 0;
`;

const SeatBadge = styled(motion.div)<{ seatType: string }>`
  display: flex;
  align-items: center;
  background-color: ${props => {
    switch(props.seatType) {
      case 'premium': return 'rgba(230, 184, 0, 0.1)';
      case 'vip': return 'rgba(220, 53, 69, 0.1)';
      default: return 'rgba(46, 49, 146, 0.1)';
    }
  }};
  border: 1px solid ${props => {
    switch(props.seatType) {
      case 'premium': return '#e6b800';
      case 'vip': return '#dc3545';
      default: return 'var(--primary)';
    }
  }};
  border-radius: 4px;
  padding: 0.3rem 0.5rem;
  font-weight: bold;
  font-size: 0.8rem;
  color: var(--text);
`;

const SeatTypeIndicator = styled.div<{ seatType: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: ${props => {
    switch(props.seatType) {
      case 'premium': return '#e6b800';
      case 'vip': return '#dc3545';
      default: return 'var(--primary)';
    }
  }};
  color: white;
  font-size: 0.6rem;
  margin-left: 0.3rem;
`;

const RemoveButton = styled(motion.button)`
  background: none;
  border: none;
  color: var(--text-light);
  font-size: 1.2rem;
  margin-left: 0.3rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
 
  &:hover {
    color: var(--accent);
  }
`;

const BookingSummary = styled.div`
  flex: 1;
`;

const ActionContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const BookButton = styled(motion.button)<{ disabled?: boolean }>`
  background-color: ${props => props.disabled ? 'var(--gray)' : 'var(--primary)'};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
 
  &:hover:not(:disabled) {
    background-color: var(--primary-hover);
  }
`;

const ButtonSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: ${spin} 1s linear infinite;
`;

const StepsIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
`;

const Step = styled.div<{ active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: ${props => props.active ? 1 : 0.6};
  transition: opacity 0.3s;
`;

const StepNumber = styled.div<{ active?: boolean }>`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: ${props => props.active ? 'var(--primary)' : '#e0e0e0'};
  color: ${props => props.active ? 'white' : 'var(--text-light)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 0.5rem;
  transition: background-color 0.3s;
 
  ${props => props.active && css`
    animation: ${pulse} 2s infinite;
  `}
`;

const StepLabel = styled.div`
  font-size: 0.8rem;
  color: var(--text);
`;

const StepConnector = styled.div`
  height: 2px;
  width: 80px;
  background-color: #e0e0e0;
  margin: 0 1rem;
 
  @media (max-width: 768px) {
    width: 40px;
  }
`;

const PaymentContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
`;

const PaymentHeader = styled.h2`
  margin-top: 0;
  margin-bottom: 2rem;
  color: var(--dark);
  text-align: center;
`;

const PaymentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
 
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const OrderSummary = styled.div`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
`;

const SummaryTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--dark);
  font-size: 1.1rem;
`;

const SummaryItem = styled.div<{ total?: boolean }>`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  font-weight: ${props => props.total ? 'bold' : 'normal'};
  font-size: ${props => props.total ? '1.1rem' : '0.9rem'};
  color: var(--text);
`;

const SummaryDivider = styled.div`
  height: 1px;
  background-color: var(--border-color);
  margin: 1rem 0;
`;

const SeatTypeSummary = styled.div`
  margin-bottom: 0.5rem;
`;

const PaymentForm = styled.div`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
`;

const FormTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--dark);
  font-size: 1.1rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
 
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-light);
  font-size: 0.9rem;
`;

const FormInput = styled.input<{ error?: boolean }>`
  width: 100%;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid ${props => props.error ? 'var(--accent)' : 'var(--border-color)'};
  background-color: white;
  color: var(--text);
  font-size: 0.9rem;
  transition: border-color 0.2s;
 
  &:focus {
    outline: none;
    border-color: ${props => props.error ? 'var(--accent)' : 'var(--primary)'};
    box-shadow: ${props => props.error ? '0 0 0 3px rgba(220, 53, 69, 0.1)' : '0 0 0 3px rgba(46, 49, 146, 0.1)'};
  }
 
  &::placeholder {
    color: #adb5bd;
  }
`;

const ErrorMessage = styled.div`
  color: var(--accent);
  font-size: 0.8rem;
  margin-top: 0.25rem;
`;

const FormDivider = styled.div`
  height: 1px;
  background-color: var(--border-color);
  margin: 1.5rem 0;
`;

const ConfirmationContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 3rem 2rem;
`;

const SuccessIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: var(--secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
  margin-bottom: 1.5rem;
`;

const ConfirmationTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--dark);
`;

const ConfirmationText = styled.p`
  text-align: center;
  color: var(--text-light);
  max-width: 500px;
  margin-bottom: 2rem;
`;

const TicketContainer = styled.div`
  width: 100%;
  max-width: 500px;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  position: relative;
  border: 1px solid var(--border-color);
 
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%232e3192' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E");
    opacity: 0.5;
  }
`;

const TicketHeader = styled.div`
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px dashed var(--border-color);
  background-color: var(--primary);
  color: white;
`;

const QRCode = styled.div`
  width: 60px;
  height: 60px;
  background-color: white;
  border-radius: 4px;
  overflow: hidden;
 
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const TicketBody = styled.div`
  padding: 1.5rem;
`;

const TicketMovie = styled.h3`
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
  color: var(--dark);
`;

const TicketDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
`;

const TicketDetail = styled.div``;

const TicketDetailLabel = styled.div`
  color: var(--text-light);
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
`;

const TicketDetailValue = styled.div`
  font-weight: bold;
  color: var(--text);
`;

const TicketFooter = styled.div`
  padding: 0.75rem;
  background-color: #f8f9fa;
  text-align: center;
`;

const TicketId = styled.div`
  font-size: 0.8rem;
  color: var(--text-light);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
 
  @media (max-width: 500px) {
    flex-direction: column;
  }
`;

const DownloadButton = styled.button`
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
 
  &:hover {
    background-color: var(--primary-hover);
  }
`;

const AddToWalletButton = styled.button`
  background-color: #212529;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
 
  &:hover {
    background-color: #343a40;
  }
`;

const DownloadIcon = styled.span`
  font-size: 1.2rem;
`;

const WalletIcon = styled.span`
  font-size: 1.2rem;
`;

// Seat component with enhanced props
const Seat: React.FC<{
  seat: SeatType;
  isSelected: boolean;
  onSelect: (seat: SeatType) => void;
  seatSize?: 'small' | 'medium' | 'large';
}> = ({ seat, isSelected, onSelect, seatSize = 'medium' }) => {
  return (
    <SeatButton
      disabled={seat.isBooked}
      isBooked={seat.isBooked}
      isSelected={isSelected}
      seatType={seat.seatType}
      seatSize={seatSize}
      onClick={() => onSelect(seat)}
      aria-label={`Seat ${seat.id}, ${seat.seatType} seat, ${seat.isBooked ? 'booked' : 'available'}`}
      whileHover={!seat.isBooked ? { y: -3, scale: 1.05 } : {}}
      whileTap={!seat.isBooked ? { scale: 0.95 } : {}}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SeatContent>
        <SeatNumber>{seat.id}</SeatNumber>
        {!seat.isBooked && !isSelected && (
          <SeatPrice>{seat.price}k</SeatPrice>
        )}
        {isSelected && (
          <CheckMark>✓</CheckMark>
        )}
      </SeatContent>
    </SeatButton>
  );
};

// Main cinema room page component
const CinemaRoomPage: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const query = new URLSearchParams(useLocation().search);
  const movieId = query.get('movieId');

  console.log("Showtime ID:", showtimeId);
  console.log("Movie ID:", movieId);

  const [selectedSeats, setSelectedSeats] = useState<SeatType[]>([]);
  const [seats, setSeats] = useState<SeatType[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [step, setStep] = useState<'select' | 'payment' | 'confirmation'>('select');
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [showtimeDetails, setShowtimeDetails] = useState<ShowtimeDetails | null>(null);

  // Ref for scroll to view
  const screenRef = useRef<HTMLDivElement>(null);

  // Gọi API để lấy thông tin phim
  useEffect(() => {
    const fetchMovieDetails = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`https://localhost:7168/api/Movie/${movieId}`);
        setMovieDetails(response.data);
      } catch (error) {
        console.error("Error fetching movie details:", error);
        alert("Không thể tải thông tin phim. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    if (movieId) {
      fetchMovieDetails();
    }
  }, [movieId]);

  // Gọi API để lấy thông tin suất chiếu
  useEffect(() => {
    const fetchShowtimeDetails = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`https://localhost:7168/api/Showtimes/${showtimeId}`);
        setShowtimeDetails(response.data);
      } catch (error) {
        console.error("Error fetching showtime details:", error);
        alert("Không thể tải thông tin suất chiếu. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    if (showtimeId) {
      fetchShowtimeDetails();
    }
  }, [showtimeId]);

  // Load seats from SeatLayout API and check booking status
  useEffect(() => {
    const fetchSeatLayoutAndStatus = async () => {
      if (!showtimeDetails?.cinema_Room_ID || !showtimeId) return;
      setIsLoading(true);
      const token = localStorage.getItem('token');

      try {
        // Fetch seat layout (for is_Active)
        const layoutResponse = await axios.get(`https://localhost:7168/api/SeatLayout/room/${showtimeDetails.cinema_Room_ID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Fetch seat status (for seat_Status)
        const statusResponse = await axios.get(`https://localhost:7168/api/Seat/showtime/${showtimeId}`);

        // Map seat statuses into a lookup object for easier access
        const seatStatusMap: Record<string, SeatStatus> = {};
        statusResponse.data.seats.$values.forEach((seat: SeatStatus) => {
          const seatId = `${seat.row_Name}${seat.seat_Number}`;
          seatStatusMap[seatId] = seat;
        });

        // Map API seats to SeatType, combining is_Active and seat_Status
        const mappedSeats: SeatType[] = layoutResponse.data.rows.$values.flatMap((row: Row) =>
          row.seats.$values.map((seat: Seat) => {
            const seatId = `${seat.row_Label}${seat.column_Number}`;
            const status = seatStatusMap[seatId];
            const isBooked = !seat.is_Active || (status && (status.seat_Status === 'Reserved' || status.seat_Status === 'Unavailable'));

            return {
              id: seatId,
              row: seat.row_Label,
              number: seat.column_Number,
              price: status ? status.price / 1000 : (seat.seat_Type === 'VIP' ? 150 : 100), // Use price from status API if available
              isBooked: isBooked, // Booked if either not active (damaged) or reserved/unavailable
              seatType: seat.seat_Type.toLowerCase() === 'vip' ? 'vip' : 'standard',
              section: seat.column_Number <= layoutResponse.data.dimensions.columns / 3 ? 'left' : seat.column_Number > (layoutResponse.data.dimensions.columns * 2) / 3 ? 'right' : 'center',
            };
          })
        );

        setSeats(mappedSeats);
      } catch (error) {
        console.error('Error fetching seat layout or status:', error);
        alert('Failed to load seat layout or status.');
      } finally {
        setIsLoading(false);
      }
    };

    if (showtimeDetails) fetchSeatLayoutAndStatus();
  }, [showtimeDetails, showtimeId]);

  // Handle seat selection
  const handleSeatSelect = (seat: SeatType) => {
    if (seat.isBooked) return; // Prevent selecting booked (inactive or reserved/unavailable) seats

    setSelectedSeats(prev => {
      const isAlreadySelected = prev.some(s => s.id === seat.id);
      if (isAlreadySelected) {
        return prev.filter(s => s.id !== seat.id);
      } else {
        if (prev.length >= 8) {
          alert('Bạn chỉ có thể chọn tối đa 8 ghế mỗi lần');
          return prev;
        }
        return [...prev, seat];
      }
    });
  };

  // Calculate total price when selected seats change
  useEffect(() => {
    const price = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
    setTotalPrice(price);
  }, [selectedSeats]);

  // Validate form fields
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (step === 'payment') {
      if (!name.trim()) newErrors.name = 'Vui lòng nhập họ tên';
      if (!email.trim()) newErrors.email = 'Vui lòng nhập email';
      else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email không hợp lệ';
      
      if (!phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
      else if (!/^[0-9]{10}$/.test(phone)) newErrors.phone = 'Số điện thoại phải có 10 chữ số';
      
      if (!cardNumber.trim()) newErrors.cardNumber = 'Vui lòng nhập số thẻ';
      else if (!/^[0-9]{16}$/.test(cardNumber.replace(/\s/g, '')))
        newErrors.cardNumber = 'Số thẻ phải có 16 chữ số';
      
      if (!expiry.trim()) newErrors.expiry = 'Vui lòng nhập ngày hết hạn';
      else if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiry))
        newErrors.expiry = 'Định dạng MM/YY không hợp lệ';
      
      if (!cvv.trim()) newErrors.cvv = 'Vui lòng nhập mã CVV';
      else if (!/^[0-9]{3,4}$/.test(cvv)) newErrors.cvv = 'CVV phải có 3-4 chữ số';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Complete booking function
  const completeBooking = () => {
    if (selectedSeats.length === 0 && step === 'select') {
      alert('Vui lòng chọn ít nhất một ghế');
      return;
    }
    
    if (step === 'select') {
      setStep('payment');
      return;
    }
    
    if (step === 'payment') {
      if (!validateForm()) return;
      
      setIsLoading(true);
      setTimeout(() => {
        setSeats(prevSeats =>
          prevSeats.map(seat =>
            selectedSeats.some(s => s.id === seat.id)
              ? { ...seat, isBooked: true }
              : seat
          )
        );
        
        setIsLoading(false);
        setStep('confirmation');
      }, 1500);
      return;
    }
    
    if (step === 'confirmation') {
      setSelectedSeats([]);
      setStep('select');
      setName('');
      setEmail('');
      setPhone('');
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setErrors({});
    }
  };

  // Group seats by row and section for display
  const seatsByRowAndSection = useMemo(() => {
    const groupedSeats: Record<string, Record<string, SeatType[]>> = {};
    
    seats.forEach(seat => {
      if (!groupedSeats[seat.row]) {
        groupedSeats[seat.row] = { left: [], center: [], right: [] };
      }
      
      groupedSeats[seat.row][seat.section].push(seat);
    });
    
    return groupedSeats;
  }, [seats]);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
 
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
 
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Handle card number input
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  return (
    <>
      <GlobalStyle />
      <PageContainer>
        <BookingSection>
          <StepsIndicator>
            <Step active={step === 'select'}>
              <StepNumber active={step === 'select'}>1</StepNumber>
              <StepLabel>Chọn ghế</StepLabel>
            </Step>
            <StepConnector />
            <Step active={step === 'payment'}>
              <StepNumber active={step === 'payment'}>2</StepNumber>
              <StepLabel>Thanh toán</StepLabel>
            </Step>
            <StepConnector />
            <Step active={step === 'confirmation'}>
              <StepNumber active={step === 'confirmation'}>3</StepNumber>
              <StepLabel>Xác nhận</StepLabel>
            </Step>
          </StepsIndicator>
          
          <AnimatePresence mode="wait">
            {step === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MovieInfoCard>
                  <MovieInfoContent>
                    {isLoading ? (
                      <LoadingContainer>
                        <LoadingSpinner />
                        <LoadingText>Đang tải thông tin phim...</LoadingText>
                      </LoadingContainer>
                    ) : (
                      <>
                        <MoviePoster src={movieDetails?.poster_URL} alt={movieDetails?.movie_Name} />
                        <MovieDetails>
                          <h2>{movieDetails?.movie_Name}</h2>
                          <MovieMetaInfo>
                            <MetaItem><MetaLabel>Thể loại:</MetaLabel> {movieDetails?.genre}</MetaItem>
                            <MetaItem><MetaLabel>Thời gian:</MetaLabel> {movieDetails?.duration} phút</MetaItem>
                            <MetaItem><MetaLabel>Ngôn ngữ:</MetaLabel> {movieDetails?.language}</MetaItem>
                            <MetaItem><MetaLabel>Xếp hạng:</MetaLabel> {movieDetails?.rating}</MetaItem>
                            <MetaItem><MetaLabel>Suất chiếu:</MetaLabel> {showtimeDetails?.room_Name} - {showtimeDetails?.start_Time}</MetaItem>
                          </MovieMetaInfo>
                        </MovieDetails>
                      </>
                    )}
                  </MovieInfoContent>
                </MovieInfoCard>
                
                <CinemaContainer ref={screenRef}>
                  {isLoading ? (
                    <LoadingContainer>
                      <LoadingSpinner />
                      <LoadingText>Đang tải sơ đồ phòng chiếu...</LoadingText>
                    </LoadingContainer>
                  ) : (
                    <>
                      <Screen>
                        <ScreenText>MÀN HÌNH</ScreenText>
                      </Screen>
                      
                      <SeatingArea>
                        {Object.entries(seatsByRowAndSection).map(([rowName, sections], rowIndex) => (
                          <RowContainer
                            key={rowName}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: rowIndex * 0.05 }}
                          >
                            <RowLabel>{rowName}</RowLabel>
                            
                            <SectionContainer>
                              {/* Left section */}
                              <SeatsSection>
                                {sections.left.map((seat) => (
                                  <Seat
                                    key={seat.id}
                                    seat={seat}
                                    isSelected={selectedSeats.some(s => s.id === seat.id)}
                                    onSelect={handleSeatSelect}
                                    seatSize={seat.seatType === 'vip' ? 'large' : 'medium'}
                                  />
                                ))}
                              </SeatsSection>
                              
                              {/* Aisle */}
                              <Aisle />
                              
                              {/* Center section */}
                              <SeatsSection>
                                {sections.center.map((seat) => (
                                  <Seat
                                    key={seat.id}
                                    seat={seat}
                                    isSelected={selectedSeats.some(s => s.id === seat.id)}
                                    onSelect={handleSeatSelect}
                                    seatSize={seat.seatType === 'vip' ? 'large' : 'medium'}
                                  />
                                ))}
                              </SeatsSection>
                              
                              {/* Aisle */}
                              <Aisle />
                              
                              {/* Right section */}
                              <SeatsSection>
                                {sections.right.map((seat) => (
                                  <Seat
                                    key={seat.id}
                                    seat={seat}
                                    isSelected={selectedSeats.some(s => s.id === seat.id)}
                                    onSelect={handleSeatSelect}
                                    seatSize={seat.seatType === 'vip' ? 'large' : 'medium'}
                                  />
                                ))}
                              </SeatsSection>
                            </SectionContainer>
                            
                            <RowLabel>{rowName}</RowLabel>
                          </RowContainer>
                        ))}
                      </SeatingArea>
                      
                      <SeatLegend>
                        <LegendItem>
                          <ColorBox color="#3b82f6" />
                          <span>Ghế thường</span>
                        </LegendItem>
                        <LegendItem>
                          <ColorBox color="#ef4444" />
                          <span>Ghế VIP</span>
                        </LegendItem>
                        <LegendItem>
                          <ColorBox color="#28a745" />
                          <span>Đã chọn</span>
                        </LegendItem>
                        <LegendItem>
                          <ColorBox color="#6c757d" />
                          <span>Đã đặt</span>
                        </LegendItem>
                      </SeatLegend>
                    </>
                  )}
                </CinemaContainer>
              </motion.div>
            )}
            
            {step === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <PaymentContainer>
                  <PaymentHeader>Hoàn tất đặt vé</PaymentHeader>
                  
                  <PaymentGrid>
                    <OrderSummary>
                      <SummaryTitle>Thông tin đặt vé</SummaryTitle>
                      <SummaryItem>
                        <span>Phim</span>
                        <span>{movieDetails?.movie_Name}</span>
                      </SummaryItem>
                      <SummaryItem>
                        <span>Suất chiếu</span>
                        <span>{showtimeDetails?.room_Name} - {showtimeDetails?.start_Time}</span>
                      </SummaryItem>
                      <SummaryItem>
                        <span>Ghế</span>
                        <span>{selectedSeats.map(s => s.id).join(', ')}</span>
                      </SummaryItem>
                      <SummaryDivider />
                      
                      <SeatTypeSummary>
                        {['standard', 'vip'].map(type => {
                          const seatsOfType = selectedSeats.filter(s => s.seatType === type);
                          if (seatsOfType.length === 0) return null;
                          
                          const subtotal = seatsOfType.reduce((sum, seat) => sum + seat.price, 0);
                          
                          return (
                            <SummaryItem key={type}>
                              <span>
                                {type === 'standard' ? 'Ghế thường' : 'Ghế VIP'} ({seatsOfType.length})
                              </span>
                              <span>{subtotal}k</span>
                            </SummaryItem>
                          );
                        })}
                      </SeatTypeSummary>
                      
                      <SummaryDivider />
                      <SummaryItem total>
                        <span>Tổng cộng</span>
                        <span>{totalPrice}k</span>
                      </SummaryItem>
                    </OrderSummary>
                    
                    <PaymentForm>
                      <FormTitle>Thông tin khách hàng</FormTitle>
                      <FormGroup>
                        <FormLabel>Họ tên</FormLabel>
                        <FormInput
                          placeholder="Nhập họ tên"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          error={!!errors.name}
                        />
                        {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
                      </FormGroup>
                      <FormGroup>
                        <FormLabel>Email</FormLabel>
                        <FormInput
                          placeholder="Nhập email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          error={!!errors.email}
                        />
                        {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
                      </FormGroup>
                      <FormGroup>
                        <FormLabel>Số điện thoại</FormLabel>
                        <FormInput
                          placeholder="Nhập số điện thoại"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          error={!!errors.phone}
                        />
                        {errors.phone && <ErrorMessage>{errors.phone}</ErrorMessage>}
                      </FormGroup>
                      
                      <FormDivider />
                      <FormTitle>Thông tin thanh toán</FormTitle>
                      
                      <FormGroup>
                        <FormLabel>Số thẻ</FormLabel>
                        <FormInput
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          maxLength={19}
                          error={!!errors.cardNumber}
                        />
                        {errors.cardNumber && <ErrorMessage>{errors.cardNumber}</ErrorMessage>}
                      </FormGroup>
                      <FormRow>
                        <FormGroup>
                          <FormLabel>Ngày hết hạn</FormLabel>
                          <FormInput
                            placeholder="MM/YY"
                            value={expiry}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d/]/g, '');
                              if (value.length === 2 && expiry.length === 1 && !value.includes('/')) {
                                setExpiry(value + '/');
                              } else if (value.length <= 5) {
                                setExpiry(value);
                              }
                            }}
                            maxLength={5}
                            error={!!errors.expiry}
                          />
                          {errors.expiry && <ErrorMessage>{errors.expiry}</ErrorMessage>}
                        </FormGroup>
                        <FormGroup>
                          <FormLabel>CVV</FormLabel>
                          <FormInput
                            placeholder="123"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                            maxLength={4}
                            error={!!errors.cvv}
                          />
                          {errors.cvv && <ErrorMessage>{errors.cvv}</ErrorMessage>}
                        </FormGroup>
                      </FormRow>
                    </PaymentForm>
                  </PaymentGrid>
                </PaymentContainer>
              </motion.div>
            )}
            
            {step === 'confirmation' && (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ConfirmationContainer>
                  <SuccessIcon>✓</SuccessIcon>
                  <ConfirmationTitle>Đặt vé thành công!</ConfirmationTitle>
                  <ConfirmationText>
                    Vé của bạn đã được đặt thành công. Mã xác nhận đã được gửi đến email của bạn.
                  </ConfirmationText>
                  
                  <TicketContainer>
                    <TicketHeader>
                      <Logo small>CinemaPlus</Logo>
                      <QRCode>
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=CINEMAPLUS12345" alt="QR Code" />
                      </QRCode>
                    </TicketHeader>
                    <TicketBody>
                      <TicketMovie>{movieDetails?.movie_Name}</TicketMovie>
                      <TicketDetails>
                        <TicketDetail>
                          <TicketDetailLabel>Suất chiếu</TicketDetailLabel>
                          <TicketDetailValue>{showtimeDetails?.room_Name} - {showtimeDetails?.start_Time}</TicketDetailValue>
                        </TicketDetail>
                        <TicketDetail>
                          <TicketDetailLabel>Ghế</TicketDetailLabel>
                          <TicketDetailValue>{selectedSeats.map(s => s.id).join(', ')}</TicketDetailValue>
                        </TicketDetail>
                        <TicketDetail>
                          <TicketDetailLabel>Phòng chiếu</TicketDetailLabel>
                          <TicketDetailValue>Phòng 3</TicketDetailValue>
                        </TicketDetail>
                      </TicketDetails>
                    </TicketBody>
                    <TicketFooter>
                      <TicketId>Mã đặt vé: CPLUS-2025-03185492</TicketId>
                    </TicketFooter>
                  </TicketContainer>
                  
                  <ActionButtons>
                    <DownloadButton>
                      Tải vé xuống <DownloadIcon>↓</DownloadIcon>
                    </DownloadButton>
                    <AddToWalletButton>
                      Thêm vào ví điện tử <WalletIcon>+</WalletIcon>
                    </AddToWalletButton>
                  </ActionButtons>
                </ConfirmationContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </BookingSection>
        
        <BookingPanel>
          <BookingPanelContent>
            <BookingSummary>
              <h3>Ghế đã chọn</h3>
              <SelectedSeatsContainer>
                {selectedSeats.length > 0 ? (
                  selectedSeats.map(seat => (
                    <SeatBadge
                      key={seat.id}
                      seatType={seat.seatType}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      {seat.id}
                      <SeatTypeIndicator seatType={seat.seatType}>
                        {seat.seatType === 'standard' ? 'T' : seat.seatType === 'vip' ? 'V' : 'P'}
                      </SeatTypeIndicator>
                      <RemoveButton
                        onClick={() => handleSeatSelect(seat)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        ×
                      </RemoveButton>
                    </SeatBadge>
                  ))
                ) : (
                  <EmptySelection>Chưa có ghế nào được chọn</EmptySelection>
                )}
              </SelectedSeatsContainer>
            </BookingSummary>
            
            <ActionContainer>
              <BookButton
                onClick={completeBooking}
                disabled={step === 'select' && selectedSeats.length === 0}
                whileHover={selectedSeats.length > 0 ? { scale: 1.05 } : {}}
                whileTap={selectedSeats.length > 0 ? { scale: 0.95 } : {}}
              >
                {isLoading && <ButtonSpinner />}
                {step === 'select' && 'Tiếp tục'}
                {step === 'payment' && 'Thanh toán'}
                {step === 'confirmation' && 'Đặt vé mới'}
              </BookButton>
            </ActionContainer>
          </BookingPanelContent>
        </BookingPanel>
      </PageContainer>
    </>
  );
};

export default CinemaRoomPage;