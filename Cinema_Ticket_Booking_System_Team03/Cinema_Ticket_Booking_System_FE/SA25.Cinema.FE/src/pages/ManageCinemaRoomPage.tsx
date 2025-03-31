import React, { useState, useEffect } from 'react';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiSearch, 
  FiX, 
  FiAlertCircle,
  FiCheck,
  FiCheckCircle,
  FiGrid,
  FiInfo,
  FiLayout,
  FiRefreshCw,
  FiAlertTriangle,
  FiEye,
  FiCheckSquare,
  FiSquare,
  FiDollarSign
} from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import Modal from '../components/Admin/Modal';
import styled from 'styled-components';
import { motion } from 'framer-motion';

// Define types for seat layout based on API response
interface Seat {
  layout_ID: number;
  row_Label: string;
  column_Number: number;
  seat_Type: string;
  is_Active: boolean;
}

interface Row {
  row: string;
  seats: {
    $values: Seat[];
  };
}

interface SeatLayout {
  cinema_room: {
    cinema_Room_ID: number;
    room_Name: string;
    room_Type: string;
  };
  rows: {
    $values: Row[];
  };
  dimensions: {
    rows: number;
    columns: number;
  };
  stats: {
    total_seats: number;
    seat_types: {
      $values: { seatType: string; count: number }[];
    };
  };
  can_modify: boolean;
}

interface CinemaRoom {
  cinema_Room_ID: number;
  room_Name: string;
  room_Type: string;
  seat_Quantity: number;
  status: string;
  notes: string;
  hasUpcomingShowtimes: boolean;
}

interface SeatTypePrice {
  room_type: string;
  seat_type: string;
  base_price: number;
}

// Styled components for seat layout display with improved UX/UI
const Screen = styled.div`
  width: 90%;
  height: 50px;
  background: linear-gradient(to bottom, #e5e7eb, #ffffff);
  border-radius: 8px;
  margin: 0 auto 3rem;
  transform: perspective(500px) rotateX(-20deg);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: 2px solid #d1d5db;

  &:after {
    content: '';
    position: absolute;
    bottom: -25px;
    left: 5%;
    width: 90%;
    height: 25px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.15), transparent);
    border-radius: 8px;
  }
`;

const ScreenText = styled.div`
  color: #4b5563;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 3px;
  text-transform: uppercase;
`;

const SeatingArea = styled.div`
  display: grid;
  grid-template-columns: 40px 1fr 40px; /* Row label, seats section, row label */
  gap: 0.5rem;
  width: 100%;
  max-width: 900px;
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
`;

const RowContainer = styled(motion.div)`
  display: contents; /* Use CSS Grid for layout */
`;

const RowLabel = styled.div`
  width: 40px;
  height: 40px;
  text-align: center;
  font-weight: 600;
  color: #374151;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 6px;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: #d1d5db;
    transform: scale(1.05);
  }
`;

const ColumnHeader = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  grid-column: 2 / 3; /* Position in the middle column of the grid */
  margin-bottom: 0.5rem;
`;

const ColumnFooter = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  grid-column: 2 / 3; /* Position in the middle column of the grid */
  margin-top: 0.5rem;
`;

const ColumnLabel = styled.div`
  width: 40px;
  height: 40px;
  text-align: center;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 6px;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: #d1d5db;
    transform: scale(1.05);
  }
`;

const SeatsSection = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  grid-column: 2 / 3; /* Position in the middle column of the grid */
`;

const SeatButtonWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const SeatButton = styled(motion.button)<{ seatType: string; isActive: boolean; isSelected: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: ${props => props.isSelected ? '3px solid #22c55e' : '1px solid #d1d5db'};
  box-shadow: ${props => props.isSelected ? '0 0 10px rgba(34, 197, 94, 0.5)' : '0 2px 4px rgba(0, 0, 0, 0.1)'};
  background-color: ${props => {
    if (!props.isActive) return '#9ca3af';
    switch (props.seatType) {
      case 'VIP':
        return '#ef4444';
      case 'Regular':
      default:
        return '#3b82f6';
    }
  }};
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const SeatNumber = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
`;

const Tooltip = styled.div`
  visibility: hidden;
  background-color: #1f2937;
  color: #ffffff;
  text-align: center;
  border-radius: 6px;
  padding: 6px 10px;
  position: absolute;
  z-index: 10;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  &:after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #1f2937 transparent transparent transparent;
  }

  ${SeatButtonWrapper}:hover & {
    visibility: visible;
  }
`;

const SeatLegend = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 2.5rem;
  flex-wrap: wrap;
  background: #ffffff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: #4b5563;
  font-weight: 500;
`;

const ColorBox = styled.div<{ color: string }>`
  width: 20px;
  height: 20px;
  background-color: ${props => props.color};
  border-radius: 4px;
  border: 1px solid #e5e7eb;
`;

const BulkActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
  background: #ffffff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const BulkSelectButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #3b82f6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #ffffff;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:hover {
    background-color: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const BulkActionSelect = styled.select`
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background-color: #ffffff;
  color: #374151;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const BulkActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #10b981;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:hover {
    background-color: #059669;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;
const ScrollableSeatingArea = styled.div`
  max-height: 500px; /* Set a fixed height for the scrollable area */
  overflow-y: auto; /* Enable vertical scrolling */
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: #f9fafb;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;
const ModalContent = styled.div`
  max-height: 80vh; /* Set max height for the modal */
  overflow-y: auto; /* Enable vertical scrolling */
  padding: 1rem; /* Add padding inside the modal */
`;
const PriceModalContent = styled.div`
  padding: 2rem;
  text-align: center;
  background: #ffffff;
  border-radius: 12px;
`;

const PriceDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  color: #1f2937;
  margin-bottom: 1.5rem;
  font-weight: 600;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const ConfirmButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #10b981;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:hover {
    background-color: #059669;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #ef4444;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:hover {
    background-color: #dc2626;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const ManageCinemaRoomPage: React.FC = () => {
  // Existing state management
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({
    room_Name: '',
    room_Type: '2D',
    seat_Quantity: 0,
    status: 'Active',
    notes: ''
  });
  const [rooms, setRooms] = useState<CinemaRoom[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreatingSeatLayout, setIsCreatingSeatLayout] = useState(false);
  const [rowsInput, setRowsInput] = useState('');
  const [columnsPerRow, setColumnsPerRow] = useState(0);
  const [seatType, setSeatType] = useState('Regular');
  const [emptyColumns, setEmptyColumns] = useState<number[]>([]);
  const [emptyColumnsInput, setEmptyColumnsInput] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // State for seat layout modal
  const [isViewingSeatLayout, setIsViewingSeatLayout] = useState(false);
  const [seatLayout, setSeatLayout] = useState<SeatLayout | null>(null);
  const [isLoadingSeatLayout, setIsLoadingSeatLayout] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [isBulkSelecting, setIsBulkSelecting] = useState(false);
  const [bulkSeatType, setBulkSeatType] = useState<string>('Regular');
  const [bulkIsActive, setBulkIsActive] = useState<boolean>(true);

  // State for seat price modal and price display
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [seatPrice, setSeatPrice] = useState<number | null>(null);
  const [seatTypesPrices, setSeatTypesPrices] = useState<SeatTypePrice[]>([]);
  const [seatPricesMap, setSeatPricesMap] = useState<{ [key: number]: number }>({});
  const [isSeatTypesPricesLoaded, setIsSeatTypesPricesLoaded] = useState(false);

  const isPrime = (num: number) => {
    if (num <= 1) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  };
  

  // Fetch seat types and prices
  const fetchSeatTypesPrices = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You need to be logged in to fetch seat prices.');
      setIsSeatTypesPricesLoaded(true);
      return;
    }

    try {
      const response = await axios.get('https://localhost:7168/api/SeatLayout/seat-types', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSeatTypesPrices(response.data.seat_types.$values || []);
      setIsSeatTypesPricesLoaded(true);
    } catch (error) {
      console.error('Error fetching seat types and prices:', error);
      toast.error('Failed to load seat prices.');
      setSeatTypesPrices([]);
      setIsSeatTypesPricesLoaded(true);
    }
  };

  // Fetch seat price for a specific seat based on room type and seat type
  const fetchSeatPrice = (seat: Seat, roomType: string) => {
    if (!isSeatTypesPricesLoaded || !seatTypesPrices || seatTypesPrices.length === 0) {
      setSeatPrice(null);
      setSeatPricesMap(prev => ({
        ...prev,
        [seat.layout_ID]: 0,
      }));
      return;
    }

    const seatTypePrice = seatTypesPrices.find(
      type => type.room_type === roomType && type.seat_type === seat.seat_Type
    );
    if (seatTypePrice) {
      setSeatPrice(seatTypePrice.base_price);
      setSeatPricesMap(prev => ({
        ...prev,
        [seat.layout_ID]: seatTypePrice.base_price,
      }));
    } else {
      setSeatPrice(null);
      setSeatPricesMap(prev => ({
        ...prev,
        [seat.layout_ID]: 0,
      }));
      toast.error(`Price not available for seat type ${seat.seat_Type} in room type ${roomType}.`);
    }
  };

  // Fetch prices for all seats in the layout
  const fetchAllSeatPrices = (layout: SeatLayout) => {
    if (!isSeatTypesPricesLoaded) {
      setTimeout(() => fetchAllSeatPrices(layout), 100);
      return;
    }

    const roomType = layout.cinema_room.room_Type;
    layout.rows.$values.forEach(row => {
      row.seats.$values.forEach(seat => {
        fetchSeatPrice(seat, roomType);
      });
    });
  };

  // Fetch rooms from API
  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('https://localhost:7168/api/CinemaRoom');
      if (response.data && Array.isArray(response.data.$values)) {
        setRooms(response.data.$values);
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Failed to load cinema rooms.');
      toast.error('Failed to load cinema rooms.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchSeatTypesPrices();
  }, []);

  // Parse empty columns input
  useEffect(() => {
    try {
      const columnValues = emptyColumnsInput
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '')
        .map(item => parseInt(item));
      const validColumns = columnValues.filter(val => !isNaN(val));
      setEmptyColumns(validColumns);
    } catch (error) {
      console.error('Error parsing empty columns:', error);
      setEmptyColumns([]);
    }
  }, [emptyColumnsInput]);

  // Fetch seat layout for a specific room
  const fetchSeatLayout = async (roomId: number) => {
    setIsLoadingSeatLayout(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You need to be logged in to view the seat layout.');
      setIsLoadingSeatLayout(false);
      return;
    }

    try {
      const response = await axios.get(`https://localhost:7168/api/SeatLayout/room/${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Seat Layout Data:', response.data); // Log to verify column_Number values
      setSeatLayout(response.data);
      fetchAllSeatPrices(response.data);
      setIsViewingSeatLayout(true);
    } catch (error) {
      console.error('Error fetching seat layout:', error);
      toast.error('Failed to load seat layout.');
    } finally {
      setIsLoadingSeatLayout(false);
    }
  };
// Add this function to handle the delete operation
const handleDeleteSeatLayout = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    toast.error('You need to be logged in to delete a seat layout.');
    return;
  }

  try {
    // Assuming the API requires layout IDs instead of cinema room ID
    const layoutIds = seatLayout?.rows.$values.flatMap(row => 
      row.seats.$values.map(seat => seat.layout_ID)
    );

    if (!layoutIds || layoutIds.length === 0) {
      toast.error('No seat layout IDs found to delete.');
      return;
    }

    const response = await axios.delete('https://localhost:7168/api/SeatLayout/bulk-delete', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: { layoutIds }
    });

    toast.success('Seat layout deleted successfully!');
    setIsViewingSeatLayout(false);
  } catch (error) {
    console.error('Error deleting seat layout:', error);
    toast.error('Failed to delete seat layout.');
  }
};

  // Update individual seat status
  const updateSeatStatus = async (layoutId: number, currentIsActive: boolean) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You need to be logged in to update seat status.');
      return;
    }

    try {
      const seat = seatLayout?.rows.$values
        .flatMap(row => row.seats.$values)
        .find(s => s.layout_ID === layoutId);

      if (!seat) {
        toast.error('Seat not found.');
        return;
      }

      const updatedSeat = {
        seatType: seat.seat_Type,
        isActive: !currentIsActive,
      };

      await axios.put(`https://localhost:7168/api/SeatLayout/seat/${layoutId}`, updatedSeat, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update local state
      setSeatLayout(prev => {
        if (!prev) return prev;
        const updatedRows = prev.rows.$values.map(row => ({
          ...row,
          seats: {
            ...row.seats,
            $values: row.seats.$values.map(s =>
              s.layout_ID === layoutId ? { ...s, is_Active: !currentIsActive } : s
            ),
          },
        }));
        return { ...prev, rows: { ...prev.rows, $values: updatedRows } };
      });

      toast.success(`Seat ${layoutId} status updated successfully!`);
    } catch (error) {
      console.error('Error updating seat status:', error);
      toast.error('Failed to update seat status.');
    }
  };

  // Bulk update seats
  const bulkUpdateSeats = async () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat to update.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You need to be logged in to perform bulk updates.');
      return;
    }

    try {
      const payload = {
        layoutIds: selectedSeats,
        seatType: bulkSeatType,
        isActive: bulkIsActive,
      };

      await axios.put('https://localhost:7168/api/SeatLayout/bulk-update', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });


      // Update local state
      setSeatLayout(prev => {
        if (!prev) return prev;
        const updatedRows = prev.rows.$values.map(row => ({
          ...row,
          seats: {
            ...row.seats,
            $values: row.seats.$values.map(s =>
              selectedSeats.includes(s.layout_ID)
                ? { ...s, seat_Type: bulkSeatType, is_Active: bulkIsActive }
                : s
            ),
          },
        }));
        return { ...prev, rows: { ...prev.rows, $values: updatedRows } };
      });

      // Reset bulk selection
      setSelectedSeats([]);
      setIsBulkSelecting(false);
      toast.success('Seats updated successfully!');
    } catch (error) {
      console.error('Error performing bulk update:', error);
      toast.error('Failed to perform bulk update.');
    }
  };

  // Handle seat click
  const handleSeatClick = (seat: Seat) => {
    if (isBulkSelecting) {
      setSelectedSeats(prev =>
        prev.includes(seat.layout_ID)
          ? prev.filter(id => id !== seat.layout_ID)
          : [...prev, seat.layout_ID]
      );
    } else {
      setSelectedSeat(seat);
      if (seatLayout) {
        fetchSeatPrice(seat, seatLayout.cinema_room.room_Type);
      }
      setIsPriceModalOpen(true);
    }
  };

  // Handle row selection
  const handleRowSelect = (row: Row) => {
    if (!isBulkSelecting) return;
    const rowSeatIds = row.seats.$values.map(seat => seat.layout_ID);
    setSelectedSeats(prev => {
      const allSelected = rowSeatIds.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !rowSeatIds.includes(id));
      } else {
        return [...new Set([...prev, ...rowSeatIds])];
      }
    });
  };

  // Handle column selection (Updated to fix staggered selection issue)
  const handleColumnSelect = (columnIndex: number) => {
    if (!isBulkSelecting || !seatLayout) return;
    // Since columnIndex is 1-based (from UI), and column_Number is also 1-based (as per seat labels),
    // we can use columnIndex directly to match seat.column_Number
    const columnSeatIds = seatLayout.rows.$values
      .map(row => row.seats.$values.find(seat => seat.column_Number === columnIndex))
      .filter(seat => seat !== undefined)
      .map(seat => seat!.layout_ID);
    setSelectedSeats(prev => {
      const allSelected = columnSeatIds.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !columnSeatIds.includes(id));
      } else {
        return [...new Set([...prev, ...columnSeatIds])];
      }
    });
  };

  // Confirm seat status update
  const confirmSeatStatusUpdate = () => {
    if (selectedSeat) {
      updateSeatStatus(selectedSeat.layout_ID, selectedSeat.is_Active);
      setIsPriceModalOpen(false);
      setSelectedSeat(null);
      setSeatPrice(null);
    }
  };

  // Modal handlers
  const handleOpenModal = () => {
    setIsAddingRoom(true);
  };

  const handleCloseModal = () => {
    setIsAddingRoom(false);
    setIsUpdatingRoom(false);
    resetNewRoom();
  };

  // Room CRUD operations
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();

     // Kiểm tra số ghế không phải là số nguyên tố
     if (isPrime(newRoom.seat_Quantity)) {
      toast.error('Số ghế không được là số nguyên tố!');
      return;
    }
    if (newRoom.seat_Quantity <= 0) {
      toast.error('Number of seats must be greater than 0!');
      return;
    }
    if (newRoom.seat_Quantity >= 200) {
      toast.error('Số ghế phải nhỏ hơn 200!');
      return;
    }
  
   
  
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You need to be logged in to create a room.');
      return;
    }

    try {
      const response = await axios.post('https://localhost:7168/api/CinemaRoom', newRoom, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRooms([...rooms, response.data]);
      toast.success('Cinema room created successfully!');
      setIsAddingRoom(false);
      resetNewRoom();
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create cinema room.');
    }
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You need to be logged in to update a room.');
      return;
    }

    try {
       // Kiểm tra số ghế không hợp lệ khi cập nhật
  if (isPrime(newRoom.seat_Quantity)) {
    toast.error('Số ghế không được là số nguyên tố!');
    return;
  }
  if (newRoom.seat_Quantity <= 0) {
    toast.error('Số ghế phải lớn hơn 0!');
    return;
  }
  if (newRoom.seat_Quantity >= 200) {
    toast.error('Số ghế phải nhỏ hơn 200!');
    return;
  }
      const response = await axios.put(`https://localhost:7168/api/CinemaRoom/${currentRoomId}`, newRoom, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRooms(rooms.map(r => (r.cinema_Room_ID === currentRoomId ? response.data : r)));
      toast.success('Cinema room updated successfully!');
      handleCloseModal();
    } catch (error) {
      console.error('Error updating room:', error);
      toast.error('Failed to update cinema room.');
    }
  };

  const handleDeleteRoom = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You need to be logged in to delete a room.');
      return;
    }

    try {
      await axios.delete(`https://localhost:7168/api/CinemaRoom/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRooms(rooms.filter(room => room.cinema_Room_ID !== id));
      toast.success('Cinema room deleted successfully!');
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Failed to delete cinema room.');
    }
  };

  const handleEditRoom = (room: CinemaRoom) => {
    setNewRoom({
      room_Name: room.room_Name,
      room_Type: room.room_Type,
      seat_Quantity: room.seat_Quantity,
      status: room.status,
      notes: room.notes
    });
    setCurrentRoomId(room.cinema_Room_ID);
    setIsUpdatingRoom(true);
    setIsAddingRoom(true);
  };

  const resetNewRoom = () => {
    setNewRoom({
      room_Name: '',
      room_Type: '2D',
      seat_Quantity: 0,
      status: 'Active',
      notes: ''
    });
  };

  // Seat layout creation
  const handleCreateSeatLayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalSeats = parseInt(newRoom.seat_Quantity.toString());
  
    let totalRows = 0;
  
    if (rowsInput.includes('-')) {
      const [start, end] = rowsInput.split('-').map(char => char.trim());
      if (start.length === 1 && end.length === 1) {
        const startCode = start.charCodeAt(0);
        const endCode = end.charCodeAt(0);
        if (startCode <= endCode) {
          totalRows = endCode - startCode + 1;
        }
      }
    } else {
      totalRows = rowsInput.split(',').length;
    }
  
    const totalColumns = columnsPerRow;
  
    if (totalSeats !== totalRows * totalColumns) {
      toast.error(
        `Total seats must equal rows × columns. Expected ${totalSeats} seats, but got ${
          totalRows * totalColumns
        } (${totalRows} rows × ${totalColumns} columns).`
      );
      return;
    }
  
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You need to be logged in to create a seat layout.');
      return;
    }
  
    try {
      const response = await axios.post(
        `https://localhost:7168/api/SeatLayout/bulk/${currentRoomId}`,
        {
          rowsInput: rowsInput,
          columnsPerRow,
          seatType,
          emptyColumns
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success('Seat layout created successfully!');
      setIsCreatingSeatLayout(false);
      setRowsInput('');
      setColumnsPerRow(0);
      setSeatType('Regular');
      setEmptyColumnsInput('');
      setEmptyColumns([]);
    } catch (error: any) {
      console.error('Error creating seat layout:', error);
      if (error.response) {
        const errorMessage = error.response.data.message || 
                            (typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.response.data) || 
                            error.response.statusText;
        toast.error(`Failed to create seat layout: ${errorMessage}`);
      } else if (error.request) {
        toast.error('Failed to create seat layout: No response from server. Check your network connection.');
      } else {
        toast.error(`Failed to create seat layout: ${error.message}`);
      }
    }
  };
  
  // Filtered rooms
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.room_Name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = '';
    let textColor = '';
    let icon = null;

    switch (status) {
      case 'Active':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        icon = <FiCheckCircle className="mr-1" />;
        break;
      case 'Maintenance':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        icon = <FiAlertTriangle className="mr-1" />;
        break;
      case 'Inactive':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        icon = <FiX className="mr-1" />;
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
        icon = <FiInfo className="mr-1" />;
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {icon}
        {status}
      </span>
    );
  };

  // Room type badge component
  const RoomTypeBadge = ({ type }: { type: string }) => {
    let bgColor = '';
    let textColor = '';

    switch (type) {
      case '2D':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        break;
      case '3D':
        bgColor = 'bg-purple-100';
        textColor = 'text-purple-800';
        break;
      case 'IMAX':
        bgColor = 'bg-indigo-100';
        textColor = 'text-indigo-800';
        break;
      case 'VIP':
        bgColor = 'bg-pink-100';
        textColor = 'text-pink-800';
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {type}
      </span>
    );
  };

  // Seat layout info display
  const SeatLayoutInfoDisplay = () => {
    let totalRows = 0;

    if (rowsInput.includes('-')) {
      const [start, end] = rowsInput.split('-').map(char => char.trim());
      if (start.length === 1 && end.length === 1) {
        const startCode = start.charCodeAt(0);
        const endCode = end.charCodeAt(0);
        if (startCode <= endCode) {
          totalRows = endCode - startCode + 1;
        }
      }
    } else {
      totalRows = rowsInput.split(',').length;
    }

    const calculatedSeats = totalRows * columnsPerRow;
    const matchesCapacity = calculatedSeats === newRoom.seat_Quantity;

    return (
      <div
        className={`bg-${
          matchesCapacity ? 'blue' : 'yellow'
        }-50 border border-${
          matchesCapacity ? 'blue' : 'yellow'
        }-200 rounded-md p-3 mt-2`}
      >
        <p
          className={`text-sm text-${
            matchesCapacity ? 'blue' : 'yellow'
          }-800`}
        >
          <FiInfo className="inline-block mr-1" />
          {rowsInput ? (
            <>
              Total seats should be equal to rows × columns. For this room:{' '}
              {totalRows} rows × {columnsPerRow} columns = {calculatedSeats}{' '} 
              seats (Room capacity: {newRoom.seat_Quantity})
              {!matchesCapacity && (
                <div className="font-medium mt-1">
                  The number of seats doesn't match the room capacity!
                </div>
              )}
            </>
          ) : (
            <>Please enter row information and column count to see calculations</>
          )}
        </p>
      </div>
    );
  };

  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Cinema Room Management</h1>
            <button
              onClick={handleOpenModal}
              className="bg-blue-600 text-white py-2 px-4 rounded-md flex items-center hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FiPlus className="h-5 w-5 mr-2" />
              New Room
            </button>
          </div>
          
          <p className="mt-2 text-sm text-gray-600">Manage your cinema rooms, their capacities, and seat layouts</p>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center">
            <FiAlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="flex items-center flex-1">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={() => fetchRooms()}
                className="ml-2 p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                title="Refresh data"
              >
                <FiRefreshCw className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-l-md border ${viewMode === 'table' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}
                >
                  <FiLayout className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-r-md border ${viewMode === 'grid' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}
                >
                  <FiGrid className="h-5 w-5" />
                </button>
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All statuses</option>
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading data...</span>
            </div>
          ) : (
            viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seats</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRooms.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No rooms found</td>
                      </tr>
                    ) : (
                      filteredRooms.map(room => (
                        <tr key={room.cinema_Room_ID} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{room.cinema_Room_ID}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{room.room_Name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <RoomTypeBadge type={room.room_Type} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{room.seat_Quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={room.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {room.notes || <span className="text-gray-400 italic">No notes</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditRoom(room)}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                title="Edit room"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(room.cinema_Room_ID)}
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                title="Delete room"
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsCreatingSeatLayout(true);
                                  setCurrentRoomId(room.cinema_Room_ID);
                                  const selectedRoom = rooms.find(r => r.cinema_Room_ID === room.cinema_Room_ID);
                                  if (selectedRoom) {
                                    setNewRoom(prev => ({
                                      ...prev,
                                      seat_Quantity: selectedRoom.seat_Quantity
                                    }));
                                  }
                                  setRowsInput('');
                                  setColumnsPerRow(0);
                                  setSeatType('Regular');
                                  setEmptyColumnsInput('');
                                  setEmptyColumns([]);
                                }}
                                className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                                title="Create seat layout"
                              >
                                <FiLayout className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => fetchSeatLayout(room.cinema_Room_ID)}
                                className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50"
                                title="View seat layout"
                              >
                                <FiEye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRooms.length === 0 ? (
                  <div className="col-span-full text-center py-10 text-gray-500">No rooms found</div>
                ) : (
                  filteredRooms.map(room => (
                    <div key={room.cinema_Room_ID} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-5">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold text-gray-900">{room.room_Name}</h3>
                          <StatusBadge status={room.status} />
                        </div>
                        
                        <div className="mt-2 flex items-center">
                          <RoomTypeBadge type={room.room_Type} />
                          <span className="ml-2 text-sm text-gray-600">{room.seat_Quantity} seats</span>
                        </div>
                        
                        <p className="mt-3 text-sm text-gray-600 line-clamp-2 h-10">
                          {room.notes || <span className="text-gray-400 italic">No notes</span>}
                        </p>
                      </div>
                      
                      <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-xs text-gray-500">ID: {room.cinema_Room_ID}</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditRoom(room)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="Edit room"
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(room.cinema_Room_ID)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            title="Delete room"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setIsCreatingSeatLayout(true);
                              setCurrentRoomId(room.cinema_Room_ID);
                              const selectedRoom = rooms.find(r => r.cinema_Room_ID === room.cinema_Room_ID);
                              if (selectedRoom) {
                                setNewRoom(prev => ({
                                  ...prev,
                                  seat_Quantity: selectedRoom.seat_Quantity
                                }));
                              }
                              setRowsInput('');
                              setColumnsPerRow(0);
                              setSeatType('Regular');
                              setEmptyColumnsInput('');
                              setEmptyColumns([]);
                            }}
                            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                            title="Create seat layout"
                          >
                            <FiLayout className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => fetchSeatLayout(room.cinema_Room_ID)}
                            className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50"
                            title="View seat layout"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )
          )}
          
          {!isLoading && filteredRooms.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredRooms.length} of {rooms.length} rooms
            </div>
          )}
        </div>

        {/* Create/Edit Room Modal */}
        <Modal isOpen={isAddingRoom} onClose={handleCloseModal}>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              {isUpdatingRoom ? <FiEdit2 className="mr-2" /> : <FiPlus className="mr-2" />} {isUpdatingRoom ? 'Update Cinema Room' : 'Create New Cinema Room'}
            </h2>
            <form onSubmit={isUpdatingRoom ? handleUpdateRoom : handleCreateRoom} className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="room_Name" className="block text-sm font-medium text-gray-700 mb-1">
                  Room Name
                </label>
                <input
                  id="room_Name"
                  type="text"
                  value={newRoom.room_Name}
                  onChange={(e) => setNewRoom({ ...newRoom, room_Name: e.target.value })}
                  placeholder="Enter room name"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="room_Type" className="block text-sm font-medium text-gray-700 mb-1">
                  Room Type
                </label>
                <select
                  id="room_Type"
                  value={newRoom.room_Type}
                  onChange={(e) => setNewRoom({ ...newRoom, room_Type: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="2D">2D</option>
                  <option value="3D">3D</option>
                  <option value="IMAX">IMAX</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>

              <div>
                <label htmlFor="seat_Quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Seats
                </label>
                <input
                  id="seat_Quantity"
                  type="number"
                  value={newRoom.seat_Quantity}
                  onChange={(e) => setNewRoom({ ...newRoom, seat_Quantity: parseInt(e.target.value) })}
                  min="1"
                  placeholder="Enter number of seats"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={newRoom.status}
                  onChange={(e) => setNewRoom({ ...newRoom, status: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={newRoom.notes}
                  onChange={(e) => setNewRoom({ ...newRoom, notes: e.target.value })}
                  placeholder="Enter any additional notes about the room"
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="mt-4 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  <FiX className="mr-2" /> Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <FiCheck className="mr-2" /> {isUpdatingRoom ? 'Update Room' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Create Seat Layout Modal */}
        <Modal isOpen={isCreatingSeatLayout} onClose={() => setIsCreatingSeatLayout(false)}>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Seat Layout</h2>
            <p className="text-gray-600 mb-6">Create a seat layout for the selected room with {newRoom.seat_Quantity} total seats.</p>
            
            <form onSubmit={handleCreateSeatLayout} className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="rowsInput" className="block text-sm font-medium text-gray-700 mb-1">
                  Rows (e.g., A-D)
                </label>
                <input
                  id="rowsInput"
                  type="text"
                  value={rowsInput}
                  onChange={(e) => setRowsInput(e.target.value)}
                  placeholder="Enter row range (e.g., A-D)"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter row range in format "A-D" or comma-separated list "A,B,C,D"
                </p>
              </div>

              <div>
                <label htmlFor="columnsPerRow" className="block text-sm font-medium text-gray-700 mb-1">
                  Columns per Row
                </label>
                <input
                  id="columnsPerRow"
                  type="number"
                  value={columnsPerRow}
                  onChange={(e) => setColumnsPerRow(parseInt(e.target.value) || 0)}
                  min="1"
                  placeholder="Enter number of columns"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Number of seats in each row
                </p>
              </div>

              <div>
                <label htmlFor="seatType" className="block text-sm font-medium text-gray-700 mb-1">
                  Seat Type
                </label>
                <select
                  id="seatType"
                  value={seatType}
                  onChange={(e) => setSeatType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="Regular">Regular</option>
                  <option value="VIP">VIP</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Select the type of seats for this layout
                </p>
              </div>

              <div>
                <label htmlFor="emptyColumns" className="block text-sm font-medium text-gray-700 mb-1">
                  Empty Columns (Optional)
                </label>
                <input
                  id="emptyColumns"
                  type="text"
                  value={emptyColumnsInput}
                  onChange={(e) => setEmptyColumnsInput(e.target.value)}
                  placeholder="e.g., 0,2,5"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter column indexes to leave empty, comma-separated (0-based indexing)
                </p>
                {emptyColumns.length > 0 && (
                  <div className="mt-1 text-xs text-blue-600">
                    Current empty columns: [{emptyColumns.join(', ')}]
                  </div>
                )}
              </div>

              <SeatLayoutInfoDisplay />

              <div className="mt-4 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsCreatingSeatLayout(false)}
                  className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  <FiX className="mr-2" /> Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
                >
                  <FiCheck className="mr-2" /> Create Layout
                </button>
              </div>
            </form>
          </div>
        </Modal>

        {/* View Seat Layout Modal */}
        <Modal isOpen={isViewingSeatLayout} onClose={() => {
  setIsViewingSeatLayout(false);
  setSelectedSeats([]);
  setIsBulkSelecting(false);
  setSeatPricesMap({});
}}>
  <ModalContent>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Seat Layout for {seatLayout?.cinema_room.room_Name}</h2>
    <p className="text-gray-600 mb-6">
      Total seats: {seatLayout?.stats.total_seats} | Dimensions: {seatLayout?.dimensions.rows} rows × {seatLayout?.dimensions.columns} columns
    </p>

    {isLoadingSeatLayout ? (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading seat layout...</span>
      </div>
    ) : seatLayout ? (
      <div className="flex flex-col items-center">
        <BulkActions>
          <BulkSelectButton onClick={() => setIsBulkSelecting(!isBulkSelecting)}>
            {isBulkSelecting ? <FiCheckSquare /> : <FiSquare />}
            {isBulkSelecting ? 'Cancel Selection' : 'Select Multiple Seats'}
          </BulkSelectButton>
          {isBulkSelecting && (
            <>
              <BulkActionSelect
                value={bulkSeatType}
                onChange={(e) => setBulkSeatType(e.target.value)}
              >
                <option value="Regular">Regular</option>
                <option value="VIP">VIP</option>
              </BulkActionSelect>
              <BulkActionSelect
                value={bulkIsActive.toString()}
                onChange={(e) => setBulkIsActive(e.target.value === 'true')}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </BulkActionSelect>
              <BulkActionButton
                onClick={bulkUpdateSeats}
                disabled={selectedSeats.length === 0}
              >
                Update {selectedSeats.length} Seat{selectedSeats.length !== 1 ? 's' : ''}
              </BulkActionButton>
            </>
          )}
        </BulkActions>

        <Screen>
          <ScreenText>SCREEN</ScreenText>
        </Screen>

        <SeatingArea>
          {/* Column Headers (Top) */}
          <div /> {/* Empty cell for left row label column */}
          <ColumnHeader>
            {Array.from({ length: seatLayout.dimensions.columns }, (_, i) => (
              <ColumnLabel key={`top-${i}`} onClick={() => handleColumnSelect(i + 1)}>
                {i + 1}
              </ColumnLabel>
            ))}
          </ColumnHeader>
          <div /> {/* Empty cell for right row label column */}

          {/* Seat Rows */}
          {seatLayout.rows.$values.map((row, rowIndex) => (
            <React.Fragment key={row.row}>
              <RowLabel onClick={() => handleRowSelect(row)}>{row.row}</RowLabel>
              <SeatsSection>
                {row.seats.$values
                  .sort((a, b) => a.column_Number - b.column_Number) // Sort seats by column_Number
                  .map(seat => (
                    <SeatButtonWrapper key={seat.layout_ID}>
                      <SeatButton
                        seatType={seat.seat_Type}
                        isActive={seat.is_Active}
                        isSelected={selectedSeats.includes(seat.layout_ID)}
                        onClick={() => handleSeatClick(seat)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <SeatNumber>{`${seat.column_Number}${seat.row_Label}`}</SeatNumber>
                      </SeatButton>
                      <Tooltip>
                        {seatPricesMap[seat.layout_ID] !== undefined
                          ? `${seatPricesMap[seat.layout_ID]} VND`
                          : 'Price not available'}
                      </Tooltip>
                    </SeatButtonWrapper>
                  ))}
              </SeatsSection>
              <RowLabel onClick={() => handleRowSelect(row)}>{row.row}</RowLabel>
            </React.Fragment>
          ))}

          {/* Column Headers (Bottom) */}
          <div /> {/* Empty cell for left row label column */}
          <ColumnFooter>
            {Array.from({ length: seatLayout.dimensions.columns }, (_, i) => (
              <ColumnLabel key={`bottom-${i}`} onClick={() => handleColumnSelect(i + 1)}>
                {i + 1}
              </ColumnLabel>
            ))}
          </ColumnFooter>
          <div /> {/* Empty cell for right row label column */}
        </SeatingArea>

        <SeatLegend>
          {seatLayout.stats.seat_types.$values.map(type => (
            <LegendItem key={type.seatType}>
              <ColorBox
                color={
                  type.seatType === 'Regular'
                    ? '#3b82f6'
                    : type.seatType === 'VIP'
                    ? '#ef4444'
                    : '#9ca3af'
                }
              />
              <span>{type.seatType} ({type.count})</span>
            </LegendItem>
          ))}
          <LegendItem>
            <ColorBox color="#9ca3af" />
            <span>Inactive</span>
          </LegendItem>
          {isBulkSelecting && (
            <LegendItem>
              <ColorBox color="#22c55e" />
              <span>Selected</span>
            </LegendItem>
          )}
        </SeatLegend>

        {/* Delete Button */}
        <div className="mt-4">
          <button
            onClick={handleDeleteSeatLayout}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <FiTrash2 className="mr-2" /> Delete Seat Layout
          </button>
        </div>
      </div>
    ) : (
      <p className="text-center text-gray-500">No seat layout available for this room.</p>
    )}

    <div className="mt-6 flex justify-end">
      <button
        onClick={() => {
          setIsViewingSeatLayout(false);
          setSelectedSeats([]);
          setIsBulkSelecting(false);
          setSeatPricesMap({});
        }}
        className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
      >
        <FiX className="mr-2" /> Close
      </button>
    </div>
  </ModalContent>
</Modal>

        {/* Seat Price and Status Update Confirmation Modal */}
        <Modal isOpen={isPriceModalOpen} onClose={() => {
          setIsPriceModalOpen(false);
          setSelectedSeat(null);
          setSeatPrice(null);
        }}>
          <PriceModalContent>
            {selectedSeat && (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Seat Details: Row {selectedSeat.row_Label}, Seat {selectedSeat.column_Number}
                </h2>
                <PriceDisplay>
                  <FiDollarSign />
                  <span>Price: {seatPrice !== null ? `${seatPrice} VND` : 'Not available'}</span>
                </PriceDisplay>
                <p className="text-gray-600 mb-4">
                  Current Status: {selectedSeat.is_Active ? 'Active' : 'Inactive'}
                </p>
                <ActionButtons>
                  <ConfirmButton onClick={confirmSeatStatusUpdate}>
                    Toggle Status to {selectedSeat.is_Active ? 'Inactive' : 'Active'}
                  </ConfirmButton>
                  <CancelButton onClick={() => {
                    setIsPriceModalOpen(false);
                    setSelectedSeat(null);
                    setSeatPrice(null);
                  }}>
                    Cancel
                  </CancelButton>
                </ActionButtons>
              </>
            )}
          </PriceModalContent>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)}>
          <div className="p-6">
            <div className="flex items-center justify-center mb-4 text-red-500">
              <FiAlertCircle className="h-12 w-12" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Confirm Deletion</h2>
            <p className="text-gray-600 mb-6 text-center">
              Are you sure you want to delete this cinema room? This action cannot be undone.
            </p>
            
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmDeleteId !== null) {
                    handleDeleteRoom(confirmDeleteId);
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>

        {/* Toast notifications */}
        <ToastContainer 
          position="bottom-right" 
          autoClose={3000} 
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </div>
  );
};

export default ManageCinemaRoomPage;