import React, { useState, useEffect } from "react";
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
  FiDollarSign,
} from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Modal from "../components/Admin/Modal"; // Assuming Modal component path is correct
import styled from "styled-components";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { API_URL } from '../config/apiUrl';
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

// Styled components (Keep all original styled components definitions here)
const Screen = styled.div`
  width: 90%;
  height: 50px;
  background: linear-gradient(to bottom, #1E2738, #0B0F19);
  border-radius: 8px;
  margin: 0 auto 3rem;
  transform: perspective(500px) rotateX(-20deg);
  box-shadow: 0 12px 24px rgba(229, 9, 20, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: 2px solid rgba(229, 9, 20, 0.4);

  &:after {
    content: "";
    position: absolute;
    bottom: -25px;
    left: 5%;
    width: 90%;
    height: 25px;
    background: linear-gradient(to bottom, rgba(229, 9, 20, 0.15), transparent);
    border-radius: 8px;
  }
`;

const ScreenText = styled.div`
  color: #e50914;
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
  color: #e2e8f0;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 6px;
  background: #1E2738;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(229, 9, 20, 0.2);
    border-color: rgba(229, 9, 20, 0.4);
    transform: scale(1.05);
  }
`;

const ColumnHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(${(props) => props.columns}, 40px);
  gap: 5px;
  justify-content: center;
  grid-column: 2 / 3; /* Position in the middle column of the grid */
  margin-bottom: 0.5rem;
`;

const ColumnFooter = styled.div`
  display: grid;
  grid-template-columns: repeat(${(props) => props.columns}, 40px);
  gap: 5px;
  justify-content: center;
  grid-column: 2 / 3; /* Position in the middle column of the grid */
  margin-top: 0.5rem;
`;

const ColumnLabel = styled.div`
  width: 40px;
  height: 40px;
  text-align: center;
  font-weight: 600;
  color: #e2e8f0;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 6px;
  background: #1E2738;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(229, 9, 20, 0.2);
    border-color: rgba(229, 9, 20, 0.4);
    transform: scale(1.05);
  }
`;

const SeatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(${(props) => props.columns}, 40px);
  gap: 5px;
  justify-content: center;
  grid-column: 2 / 3; /* Position in the middle column of the grid */
`;

const SeatButtonWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const SeatButton = styled(motion.button)<{
  seatType: string;
  isActive: boolean;
  isSelected: boolean;
}>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: ${(props) =>
    props.isSelected ? "3px solid #22c55e" : "1px solid #d1d5db"};
  box-shadow: ${(props) =>
    props.isSelected
      ? "0 0 10px rgba(34, 197, 94, 0.5)"
      : "0 2px 4px rgba(0, 0, 0, 0.1)"};
  background-color: ${(props) => {
    if (!props.isActive) return "#9ca3af";
    switch (props.seatType) {
      case "VIP":
        return "#ef4444";
      case "Regular":
      default:
        return "#3b82f6";
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
    content: "";
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
  background-color: ${(props) => props.color};
  border-radius: 4px;
  border: 1px solid #e5e7eb;
`;

const BulkActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
  background: #1E2738;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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
  padding: 0.6rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background-color: #0B0F19;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #E50914;
    box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.2);
  }
`;

const BulkActionButton = styled.button`
  padding: 0.6rem 1.25rem;
  background: linear-gradient(to right, #10b981, #059669);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
  }

  &:disabled {
    background: #374151;
    color: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;
const ScrollableSeatingArea = styled.div`
  max-height: 500px; /* Set a fixed height for the scrollable area */
  overflow-y: auto; /* Enable vertical scrolling */
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: #0B0F19;
  padding: 1.5rem;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
`;
const ModalContent = styled.div`
  max-height: 80vh; /* Set max height for the modal */
  overflow-y: auto; /* Enable vertical scrolling */
  padding: 1rem; /* Add padding inside the modal */
  color: #ffffff;
`;
const PriceModalContent = styled.div`
  padding: 2rem;
  text-align: center;
  background: #161D2F;
  border-radius: 16px;
  color: #ffffff;
`;

const PriceDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  color: #ef4444;
  margin-bottom: 1.5rem;
  font-weight: 700;
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
// --- End of Styled Components ---

const ManageCinemaRoomPage: React.FC = () => {
  // Existing state management
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false);
  const [newRoom, setNewRoom] = useState<
    Omit<CinemaRoom, "cinema_Room_ID" | "hasUpcomingShowtimes">
  >({
    // Omit IDs for new room state
    room_Name: "",
    room_Type: "2D",
    seat_Quantity: 0,
    status: "Active",
    notes: "",
  });
  const [rooms, setRooms] = useState<CinemaRoom[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreatingSeatLayout, setIsCreatingSeatLayout] = useState(false);
  const [rowsInput, setRowsInput] = useState("");
  const [columnsPerRow, setColumnsPerRow] = useState(0);
  const [seatType, setSeatType] = useState("Regular");
  const [emptyColumns, setEmptyColumns] = useState<number[]>([]);
  const [emptyColumnsInput, setEmptyColumnsInput] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // State for seat layout modal
  const [isViewingSeatLayout, setIsViewingSeatLayout] = useState(false);
  const [seatLayout, setSeatLayout] = useState<SeatLayout | null>(null);
  const [isLoadingSeatLayout, setIsLoadingSeatLayout] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [isBulkSelecting, setIsBulkSelecting] = useState(false);
  const [bulkSeatType, setBulkSeatType] = useState<string>("Regular");
  const [bulkIsActive, setBulkIsActive] = useState<boolean>(true);

  const [overwriteExisting, setOverwriteExisting] = useState(false);

  // State for seat price modal and price display
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [seatPrice, setSeatPrice] = useState<number | null>(null);
  const [seatTypesPrices, setSeatTypesPrices] = useState<SeatTypePrice[]>([]);
  const [seatPricesMap, setSeatPricesMap] = useState<{ [key: number]: number }>(
    {}
  );
  const [isSeatTypesPricesLoaded, setIsSeatTypesPricesLoaded] = useState(false);

  // --- NEW State for Create from Template ---
  const [createMode, setCreateMode] = useState<"manual" | "template">("manual");
  const [selectedTemplateRoomId, setSelectedTemplateRoomId] = useState<
    number | null
  >(null);
  const [selectedTemplateRoom, setSelectedTemplateRoom] =
    useState<CinemaRoom | null>(null);
  const [isViewingTemplateLayout, setIsViewingTemplateLayout] = useState(false);
  const [
    returnToAddRoomAfterViewingLayout,
    setReturnToAddRoomAfterViewingLayout,
  ] = useState(false);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [roomsPerPage, setRoomsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();

  // Lấy role từ localStorage
  const getRole = () => {
    return localStorage.getItem("role") || sessionStorage.getItem("role");
  };

  // Kiểm tra quyền truy cập
  useEffect(() => {
    const role = getRole();
    if (role !== "Admin") {
      toast.error("Bạn không có quyền truy cập trang này.");
      navigate("/"); // Điều hướng sang trang unauthorized
    }
  }, [navigate]);
  // Helper function to check for prime numbers
  const isPrime = (num: number) => {
    if (num <= 1) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  };

  // Fetch seat types and prices
  const fetchSeatTypesPrices = async () => {
    const token = localStorage.getItem("token");
    setIsSeatTypesPricesLoaded(false); // Set loading before fetch
    try {
      const response = await axios.get(
        `${API_URL}/SeatLayout/seat-types`,
        {
          headers: {
            // Conditionally add Authorization header only if token exists
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (response.data?.seat_types?.$values) {
        setSeatTypesPrices(response.data.seat_types.$values);
      } else {
        setSeatTypesPrices([]); // Ensure it's an array even if data is missing
      }
    } catch (error) {
      console.error("Error fetching seat types and prices:", error);
      setSeatTypesPrices([]);
    } finally {
      setIsSeatTypesPricesLoaded(true);
    }
  };

  // Fetch seat price for a specific seat based on room type and seat type
  const fetchSeatPrice = (seat: Seat, roomType: string) => {
    if (
      !isSeatTypesPricesLoaded ||
      !seatTypesPrices ||
      seatTypesPrices.length === 0
    ) {
      // If prices aren't loaded or empty, set price to null/0
      setSeatPrice(null);
      setSeatPricesMap((prev) => ({
        ...prev,
        [seat.layout_ID]: 0, // Represent unavailable price as 0 or null in the map
      }));
      return;
    }

    const seatTypePrice = seatTypesPrices.find(
      (type) => type.room_type === roomType && type.seat_type === seat.seat_Type
    );
    const price = seatTypePrice ? seatTypePrice.base_price : null; // Use null for not found
    setSeatPrice(price);
    setSeatPricesMap((prev) => ({
      ...prev,
      [seat.layout_ID]: price ?? 0, // Store null or 0 in the map
    }));
  };

  // Fetch prices for all seats in the layout
  const fetchAllSeatPrices = (layout: SeatLayout) => {
    if (!isSeatTypesPricesLoaded) {
      // Wait briefly and retry if prices aren't loaded yet
      setTimeout(() => fetchAllSeatPrices(layout), 150);
      return;
    }

    const roomType = layout.cinema_room.room_Type;
    layout.rows.$values.forEach((row) => {
      row.seats.$values.forEach((seat) => {
        fetchSeatPrice(seat, roomType);
      });
    });
  };

  // Fetch rooms from API
  const fetchRooms = async () => {
    setIsLoading(true);
    setError(null); // Clear previous errors
    try {
      const response = await axios.get(`${API_URL}/CinemaRoom`);
      if (response.data && Array.isArray(response.data.$values)) {
        // Sắp xếp phòng theo ID từ lớn đến nhỏ
        const sortedRooms = response.data.$values.sort(
          (a, b) => b.cinema_Room_ID - a.cinema_Room_ID
        );
        setRooms(sortedRooms);
      } else {
        console.warn("Invalid data format received for rooms:", response.data);
        setRooms([]); // Set to empty array on invalid format
        throw new Error("Invalid data format");
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setError("Failed to load cinema rooms. Please try again.");
      toast.error("Failed to load cinema rooms.");
      setRooms([]); // Ensure rooms is empty on error
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
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "")
        .map((item) => parseInt(item));
      // Filter out NaN values and ensure they are non-negative integers
      const validColumns = columnValues.filter(
        (val) => !isNaN(val) && Number.isInteger(val) && val >= 0
      );
      setEmptyColumns(validColumns);
    } catch (error) {
      console.error("Error parsing empty columns:", error);
      setEmptyColumns([]);
    }
  }, [emptyColumnsInput]);

  // --- NEW: Handle template room selection ---
  const handleTemplateRoomChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const templateId = e.target.value ? parseInt(e.target.value) : null;
    setSelectedTemplateRoomId(templateId);

    if (templateId) {
      // Find the template room in the rooms list
      const template = rooms.find((room) => room.cinema_Room_ID === templateId);
      if (template) {
        setSelectedTemplateRoom(template);
        // Update seat quantity from template, but keep other form values
        setNewRoom((prev) => ({
          ...prev,
          seat_Quantity: template.seat_Quantity,
        }));
      }
    } else {
      setSelectedTemplateRoom(null);
      // Reset seat quantity if no template selected
      setNewRoom((prev) => ({
        ...prev,
        seat_Quantity: 0,
      }));
    }
  };

  // Fetch seat layout for a specific room
  const fetchSeatLayout = async (roomId: number) => {
    setIsLoadingSeatLayout(true);
    setSeatLayout(null); // Clear previous layout
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required to view seat layout.");
      setIsLoadingSeatLayout(false);
      return;
    }

    try {
      const response = await axios.get(
        `${API_URL}/SeatLayout/room/${roomId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Seat Layout Data:", response.data); // Log to verify data
      if (response.data && response.data.cinema_room) {
        // Basic validation
        setSeatLayout(response.data);
        // Fetch prices only after layout is successfully set
        fetchAllSeatPrices(response.data);
        setIsViewingSeatLayout(true);
      } else {
        throw new Error("Invalid seat layout data received");
      }
    } catch (error: any) {
      console.error("Error fetching seat layout:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.statusText ||
        error.message ||
        "Failed to load seat layout.";
      toast.error(`Error: ${errorMessage}`);
      setSeatLayout(null); // Ensure layout is null on error
      setIsViewingSeatLayout(false); // Close modal if fetch fails
    } finally {
      setIsLoadingSeatLayout(false);
    }
  };

  // Handle the delete operation for seat layout
  const handleDeleteSeatLayout = async () => {
    if (!seatLayout) {
      toast.error("No seat layout is currently loaded.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required to delete a seat layout.");
      return;
    }

    // Confirmation Dialog (Recommended)
    if (
      !window.confirm(
        `Are you sure you want to delete the entire seat layout for room "${seatLayout.cinema_room.room_Name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      // Assuming the API expects the Cinema Room ID for deletion, not individual layout IDs
      const roomIdToDelete = seatLayout.cinema_room.cinema_Room_ID;

      // !!! IMPORTANT: Verify the correct API endpoint and method for deleting a *whole* layout.
      // This might be DELETE /api/SeatLayout/room/{roomId} or similar.
      // The current code assumes a bulk-delete endpoint which might be incorrect for deleting the whole layout.
      // Using a placeholder - replace with the actual endpoint.
      // const response = await axios.delete(`${API_URL}/SeatLayout/room/${roomIdToDelete}`, {
      //   headers: { Authorization: `Bearer ${token}` },
      // });

      // --- TEMPORARY PLACEHOLDER for assumed bulk-delete endpoint ---
      // If the API truly requires bulk delete of all IDs:
      const layoutIds = seatLayout.rows.$values.flatMap((row) =>
        row.seats.$values.map((seat) => seat.layout_ID)
      );
      if (!layoutIds || layoutIds.length === 0) {
        toast.warn("No seats found in the layout to delete.");
        return;
      }
      await axios.delete(`${API_URL}/SeatLayout/bulk-delete`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { layoutIds }, // Send IDs in the request body for DELETE
      });
      // --- END OF TEMPORARY PLACEHOLDER ---

      toast.success("Seat layout deleted successfully!");
      setIsViewingSeatLayout(false); // Close the modal
      setSeatLayout(null); // Clear the layout data
      // Optionally, you might want to refresh the main room list if layout status affects it
      // fetchRooms();
    } catch (error: any) {
      console.error("Error deleting seat layout:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.statusText ||
        error.message ||
        "Failed to delete seat layout.";
      toast.error(`Error: ${errorMessage}`);
    }
  };

  // Update individual seat status
  const updateSeatStatus = async (
    layoutId: number,
    currentIsActive: boolean
  ) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required to update seat status.");
      return;
    }

    try {
      const seat = seatLayout?.rows.$values
        .flatMap((row) => row.seats.$values)
        .find((s) => s.layout_ID === layoutId);

      if (!seat) {
        toast.error("Seat not found.");
        return;
      }

      const updatedSeatPayload = {
        // Assuming API needs seatType and isActive for update
        seatType: seat.seat_Type,
        isActive: !currentIsActive,
      };

      await axios.put(
        `${API_URL}/SeatLayout/seat/${layoutId}`,
        updatedSeatPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state for immediate UI feedback
      setSeatLayout((prevLayout) => {
        if (!prevLayout) return null;
        const updatedRows = prevLayout.rows.$values.map((row) => ({
          ...row,
          seats: {
            ...row.seats,
            $values: row.seats.$values.map((s) =>
              s.layout_ID === layoutId
                ? { ...s, is_Active: !currentIsActive }
                : s
            ),
          },
        }));
        return {
          ...prevLayout,
          rows: { ...prevLayout.rows, $values: updatedRows },
        };
      });

      toast.success(
        `Seat ${seat.row_Label}${seat.column_Number} status updated to ${
          !currentIsActive ? "Active" : "Inactive"
        }.`
      );
    } catch (error: any) {
      console.error("Error updating seat status:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.statusText ||
        error.message ||
        "Failed to update seat status.";
      toast.error(`Error: ${errorMessage}`);
      // Optional: Revert local state change on error? Or refetch layout?
      // fetchSeatLayout(seatLayout.cinema_room.cinema_Room_ID); // Refetch on error
    }
  };

  // Bulk update seats
  const bulkUpdateSeats = async () => {
    if (selectedSeats.length === 0) {
      toast.warn("No seats selected for bulk update.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required to update seats.");
      return;
    }

    try {
      const payload = {
        layoutIds: selectedSeats,
        seatType: bulkSeatType,
        isActive: bulkIsActive,
      };

      await axios.put(
        `${API_URL}/SeatLayout/bulk-update`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state for immediate UI feedback
      setSeatLayout((prevLayout) => {
        if (!prevLayout) return null;
        const updatedRows = prevLayout.rows.$values.map((row) => ({
          ...row,
          seats: {
            ...row.seats,
            $values: row.seats.$values.map((s) =>
              selectedSeats.includes(s.layout_ID)
                ? { ...s, seat_Type: bulkSeatType, is_Active: bulkIsActive }
                : s
            ),
          },
        }));
        return {
          ...prevLayout,
          rows: { ...prevLayout.rows, $values: updatedRows },
        };
      });

      toast.success(`${selectedSeats.length} seats updated successfully.`);
      setSelectedSeats([]); // Clear selection after update
      setIsBulkSelecting(false); // Exit bulk selection mode
    } catch (error: any) {
      console.error("Error bulk updating seats:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.statusText ||
        error.message ||
        "Failed to update seats.";
      toast.error(`Error: ${errorMessage}`);
    }
  };

  // Handle seat selection for bulk operations
  const toggleSeatSelection = (layoutId: number) => {
    if (!isBulkSelecting) return;

    setSelectedSeats((prev) =>
      prev.includes(layoutId)
        ? prev.filter((id) => id !== layoutId)
        : [...prev, layoutId]
    );
  };

  // Handle column selection (Fixed version)
  const handleColumnSelect = (columnIndex: number) => {
    if (!isBulkSelecting || !seatLayout) return;

    // Find all seats in the specified column
    const columnSeatIds = seatLayout.rows.$values.flatMap((row) =>
      row.seats.$values
        .filter((seat) => seat.column_Number === columnIndex)
        .map((seat) => seat.layout_ID)
    );

    // Check if all seats in the column are already selected
    const allSelected = columnSeatIds.every((id) => selectedSeats.includes(id));

    if (allSelected) {
      // Deselect all seats in the column
      setSelectedSeats((prev) =>
        prev.filter((id) => !columnSeatIds.includes(id))
      );
    } else {
      // Select all seats in the column
      setSelectedSeats((prev) => [...new Set([...prev, ...columnSeatIds])]);
    }
  };

  // Handle row selection (select all seats in a row)
  const handleRowSelect = (row: Row) => {
    if (!isBulkSelecting) return;

    const rowSeatIds = row.seats.$values.map((seat) => seat.layout_ID);

    // Check if all seats in this row are already selected
    const allSelected = rowSeatIds.every((id) => selectedSeats.includes(id));

    if (allSelected) {
      // Deselect all seats in this row
      setSelectedSeats((prev) => prev.filter((id) => !rowSeatIds.includes(id)));
    } else {
      // Select all seats in this row
      setSelectedSeats((prev) => {
        const uniqueIds = new Set([...prev, ...rowSeatIds]);
        return Array.from(uniqueIds);
      });
    }
  };

  // Handle seat click (view price or update status)
  const handleSeatClick = (seat: Seat) => {
    if (isBulkSelecting) {
      toggleSeatSelection(seat.layout_ID);
      return;
    }

    // If not in bulk selection mode, show price and status toggle
    setSelectedSeat(seat);
    setSeatPrice(seatPricesMap[seat.layout_ID] || null);
    setIsPriceModalOpen(true);
  };

  // Create a new room
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required to create a room.");
      return;
    }

    // --- Logic for Create from Template ---
    if (createMode === "template") {
      if (!selectedTemplateRoomId) {
        toast.error("Please select a template room.");
        return;
      }
      if (!newRoom.room_Name.trim()) {
        toast.error("Please enter a name for the new room.");
        return;
      }

      const payload = {
        roomName: newRoom.room_Name.trim(),
        templateRoomId: selectedTemplateRoomId,
        roomType: newRoom.room_Type,
        status: newRoom.status,
        notes: newRoom.notes,
      };

      try {
        const response = await axios.post(
          `${API_URL}/SeatLayout/create-room-with-layout`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Chỉnh sửa phần này để phù hợp với cấu trúc response thực tế
        if (response.data && response.data.cinema_room) {
          // Thay vì chỉ thêm phòng mới vào state, fetch lại toàn bộ danh sách
          await fetchRooms();

          // Hiển thị thông báo thành công với message từ API
          toast.success(
            response.data.message ||
              `Cinema room '${response.data.cinema_room.room_Name}' created successfully from template!`
          );
          handleCloseModal();
        } else {
          console.error("Unexpected response structure:", response.data);
          throw new Error("Invalid response data from server.");
        }
      } catch (error: any) {
        console.error("Error creating room from template:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Failed to create room from template.";
        toast.error(`Error: ${errorMessage}`);
      }
    } else {
      // --- Logic for Create Manually ---
      // Validate input

      if (!newRoom.room_Name.trim()) {
        toast.error("Room name is required.");
        return;
      }
      if (
        newRoom.seat_Quantity === undefined ||
        newRoom.seat_Quantity === null
      ) {
        toast.error("Seat quantity is required and cannot be empty.");
        return;
      }
      if (!Number.isInteger(newRoom.seat_Quantity)) {
        toast.error("Seat quantity must be an integer.");
        return;
      }
      if (newRoom.seat_Quantity < 50) {
        toast.error("Seat quantity must be greater than 50.");
        return;
      }
      if (newRoom.seat_Quantity > 150) {
        toast.error("Seat quantity must be lower than 150.");
        return;
      }
      try {
        const response = await axios.post(
          `${API_URL}/CinemaRoom`,
          newRoom,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data && response.data.cinema_Room_ID) {
          // Thay vì chỉ thêm phòng mới vào state, fetch lại toàn bộ danh sách
          await fetchRooms();

          toast.success(
            `Cinema room '${response.data.room_Name}' created successfully!`
          );
          handleCloseModal();
        } else {
          throw new Error("Invalid response data from server.");
        }
      } catch (error: any) {
        console.error("Error creating room:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Failed to create room.";
        toast.error(`Error: ${errorMessage}`);
      }
    }
  };

  // Update an existing room
  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoomId) {
      toast.error("No room selected for update.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required to update a room.");
      return;
    }

    // Validate input

    if (!newRoom.room_Name.trim()) {
      toast.error("Room name is required.");
      return;
    }
    if (newRoom.seat_Quantity === undefined || newRoom.seat_Quantity === null) {
      toast.error("Seat quantity is required and cannot be empty.");
      return;
    }
    if (!Number.isInteger(newRoom.seat_Quantity)) {
      toast.error("Seat quantity must be an integer.");
      return;
    }
    if (newRoom.seat_Quantity < 50) {
      toast.error("Seat quantity must be greater than 50.");
      return;
    }
    if (newRoom.seat_Quantity > 150) {
      toast.error("Seat quantity must be lower than 150.");
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/CinemaRoom/${currentRoomId}`,
        {
          cinema_Room_ID: currentRoomId,
          ...newRoom,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data) {
        // Fetch lại toàn bộ danh sách thay vì chỉ cập nhật một phòng
        await fetchRooms();

        toast.success(
          `Cinema room '${response.data.room_Name}' updated successfully!`
        );
        handleCloseModal();
      } else {
        throw new Error("Invalid response data from server.");
      }
    } catch (error: any) {
      console.error("Error updating room:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        "Failed to update room.";
      toast.error(`Error: ${errorMessage}`);
    }
  };

  // Delete a room
  const handleDeleteRoom = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required to delete a room.");
      return;
    }

    try {
      await axios.delete(`${API_URL}/CinemaRoom/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Fetch lại toàn bộ danh sách thay vì chỉ xóa một phòng khỏi state
      await fetchRooms();

      toast.success("Cinema room deleted successfully!");
      setConfirmDeleteId(null); // Close confirmation modal
    } catch (error: any) {
      console.error("Error deleting room:", error);

      // Check if the error is due to upcoming showtimes
      if (
        error.response?.status === 400 &&
        error.response?.data?.includes("upcoming showtimes")
      ) {
        toast.error("Cannot delete room with upcoming showtimes.");
      } else {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Failed to delete room.";
        toast.error(`Error: ${errorMessage}`);
      }
      setConfirmDeleteId(null); // Close confirmation modal
    }
  };

  // Create a new seat layout
  const handleCreateSeatLayout = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalSeats = parseInt(newRoom.seat_Quantity.toString());
    let totalRows = 0;

    if (rowsInput.includes("-")) {
      const [start, end] = rowsInput.split("-").map((char) => char.trim());
      if (start.length === 1 && end.length === 1) {
        const startCode = start.charCodeAt(0);
        const endCode = end.charCodeAt(0);
        if (startCode <= endCode) {
          totalRows = endCode - startCode + 1;
        }
      }
    } else {
      totalRows = rowsInput.split(",").length;
    }

    const totalColumns = columnsPerRow;

    // Bỏ qua kiểm tra nếu overwriteExisting là true
    if (!overwriteExisting && totalSeats !== totalRows * totalColumns) {
      toast.error(
        `Total seats must equal rows × columns. Expected ${totalSeats} seats, but got ${
          totalRows * totalColumns
        } (${totalRows} rows × ${totalColumns} columns).`
      );
      return;
    }

    if (!currentRoomId) {
      toast.error("No room selected for seat layout creation.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required to create a seat layout.");
      return;
    }

    // Validate input
    if (!rowsInput.trim()) {
      toast.error("Row labels are required.");
      return;
    }
    if (columnsPerRow <= 0) {
      toast.error("Number of columns must be greater than 0.");
      return;
    }

    try {
      const payload = {
        rowsInput: rowsInput.trim(),
        columnsPerRow,
        seatType,
        emptyColumns: emptyColumns.length > 0 ? emptyColumns : [],
        overwriteExisting,
      };

      // Sử dụng API mới: /api/SeatLayout/bulk/{roomId}
      await axios.post(
        `${API_URL}/SeatLayout/bulk/${currentRoomId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Seat layout created successfully!");
      await fetchRooms(); // Cập nhật danh sách phòng
      await fetchSeatLayout(currentRoomId); // Hiển thị layout map mới nhất
      setIsCreatingSeatLayout(false); // Đóng modal tạo layout
      //   window.location.reload();
      // Fetch the newly created layout
      fetchSeatLayout(currentRoomId);
    } catch (error: any) {
      console.error("Error creating seat layout:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        "Failed to create seat layout.";
      toast.error(`Error: ${errorMessage}`);
    }
  };

  // Open the add room modal
  const handleAddRoom = () => {
    setNewRoom({
      room_Name: "",
      room_Type: "2D",
      seat_Quantity: 0,
      status: "Active",
      notes: "",
    });
    setIsUpdatingRoom(false);
    setIsAddingRoom(true);
    setCreateMode("manual"); // Default to manual creation
    setSelectedTemplateRoomId(null);
    setSelectedTemplateRoom(null);
  };

  // Open the update room modal
  const handleEditRoom = (room: CinemaRoom) => {
    setCurrentRoomId(room.cinema_Room_ID);
    setNewRoom({
      room_Name: room.room_Name,
      room_Type: room.room_Type,
      seat_Quantity: room.seat_Quantity,
      status: room.status,
      notes: room.notes || "",
    });
    setIsAddingRoom(false);
    setIsUpdatingRoom(true);
  };

  // Open the seat layout creation modal
  const handleOpenCreateSeatLayout = (roomId: number) => {
    const selectedRoom = rooms.find((room) => room.cinema_Room_ID === roomId);
    if (!selectedRoom) {
      toast.error("Room not found.");
      return;
    }

    setCurrentRoomId(roomId);
    setNewRoom({
      ...selectedRoom, // Cập nhật thông tin phòng
    });
    setRowsInput("");
    setColumnsPerRow(0);
    setSeatType("Regular");
    setEmptyColumnsInput("");
    setEmptyColumns([]);
    setIsCreatingSeatLayout(true);
  };

  // Close all modals
  const handleCloseModal = () => {
    setIsAddingRoom(false);
    setIsUpdatingRoom(false);
    setIsCreatingSeatLayout(false);
    setConfirmDeleteId(null);
    setCurrentRoomId(null);
    setNewRoom({
      room_Name: "",
      room_Type: "2D",
      seat_Quantity: 0,
      status: "Active",
      notes: "",
    });
    setSelectedTemplateRoomId(null);
    setSelectedTemplateRoom(null);
    setCreateMode("manual");
  };

  // --- NEW: View template layout ---
  const viewTemplateLayout = () => {
    if (selectedTemplateRoomId) {
      setReturnToAddRoomAfterViewingLayout(true);
      setIsViewingTemplateLayout(true); // Đánh dấu đang xem layout mẫu
      fetchSeatLayout(selectedTemplateRoomId);
    } else {
      toast.error("Vui lòng chọn một phòng mẫu trước.");
    }
  };

  // Handle closing the seat layout modal
  const handleCloseSeatLayoutModal = () => {
    setIsViewingSeatLayout(false);
    setSeatLayout(null);
    setSelectedSeats([]);
    setIsBulkSelecting(false);
    setSeatPricesMap({});
    setIsViewingTemplateLayout(false); // Reset trạng thái xem template

    // If we were viewing a template layout and need to return to add room form
    if (returnToAddRoomAfterViewingLayout) {
      setReturnToAddRoomAfterViewingLayout(false);
      setIsAddingRoom(true);
    }
  };

  // Filter rooms based on search term and status
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.room_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.room_Type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || room.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Tính toán phân trang
  useEffect(() => {
    const totalPagesCount = Math.ceil(filteredRooms.length / roomsPerPage);
    setTotalPages(totalPagesCount || 1);

    // Đảm bảo currentPage không vượt quá totalPages
    if (currentPage > totalPagesCount && totalPagesCount > 0) {
      setCurrentPage(totalPagesCount);
    }
  }, [filteredRooms, roomsPerPage]);

  // Lấy danh sách phòng cho trang hiện tại
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * roomsPerPage,
    currentPage * roomsPerPage
  );

  // Hàm chuyển trang
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Hàm thay đổi số lượng phòng mỗi trang
  const handleRoomsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setRoomsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset về trang 1 khi thay đổi số phòng mỗi trang
  };
  // Seat layout info display
  const SeatLayoutInfoDisplay = () => {
    let totalRows = 0;

    if (rowsInput.includes("-")) {
      const [start, end] = rowsInput.split("-").map((char) => char.trim());
      if (start.length === 1 && end.length === 1) {
        const startCode = start.charCodeAt(0);
        const endCode = end.charCodeAt(0);
        if (startCode <= endCode) {
          totalRows = endCode - startCode + 1;
        }
      }
    } else {
      totalRows = rowsInput.split(",").length;
    }

    const calculatedSeats = totalRows * columnsPerRow;
    const matchesCapacity = calculatedSeats === newRoom.seat_Quantity;

    return (
      <div
        className={`bg-${
          matchesCapacity ? "blue" : "yellow"
        }-50 border border-${
          matchesCapacity ? "blue" : "yellow"
        }-200 rounded-md p-3 mt-2`}
      >
        <p
          className={`text-sm text-${matchesCapacity ? "blue" : "yellow"}-800`}
        >
          <FiInfo className="inline-block mr-1" />
          {rowsInput ? (
            <>
              Total seats should be equal to rows × columns. For this room:{" "}
              {totalRows} rows × {columnsPerRow} columns = {calculatedSeats}{" "}
              seats (Room capacity: {newRoom.seat_Quantity})
              {!matchesCapacity && (
                <div className="font-medium mt-1">
                  The number of seats doesn't match the room capacity!
                </div>
              )}
            </>
          ) : (
            <>
              Please enter row information and column count to see calculations
            </>
          )}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <ToastContainer position="top-right" autoClose={5000} theme="dark" />

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-white/10 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-red-600/10 text-red-500 border border-red-500/20">
                <FiLayout className="text-xl" />
              </span>
              Quản lý phòng chiếu
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Tạo và quản lý các phòng chiếu phim cùng sơ đồ ghế ngồi
            </p>
          </div>
          <button
            onClick={handleAddRoom}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors shadow-lg shadow-red-600/30"
          >
            <FiPlus className="h-5 w-5" />
            Thêm phòng chiếu
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="bg-[#161D2F] border border-white/10 rounded-2xl shadow-xl p-5 mb-6 text-white">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-grow">
              {/* Search Input */}
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Tìm kiếm phòng chiếu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2.5 pl-10 bg-[#1E2738] border border-white/10 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
                />
                <FiSearch className="absolute left-3.5 top-3 text-gray-400 h-4 w-4" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3.5 top-3 text-gray-400 hover:text-white"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="min-w-[180px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2.5 bg-[#1E2738] border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
                >
                  <option value="all" className="bg-[#1E2738] text-white">Tất cả trạng thái</option>
                  <option value="Active" className="bg-[#1E2738] text-white">Đang hoạt động</option>
                  <option value="Inactive" className="bg-[#1E2738] text-white">Đã tắt</option>
                  <option value="Maintenance" className="bg-[#1E2738] text-white">Bảo trì</option>
                </select>
              </div>

              {/* Rooms Per Page */}
              <div className="min-w-[170px]">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400 whitespace-nowrap">
                    Hiển thị:
                  </label>
                  <select
                    value={roomsPerPage}
                    onChange={handleRoomsPerPageChange}
                    className="flex-grow p-2.5 bg-[#1E2738] border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
                  >
                    <option value={5} className="bg-[#1E2738] text-white">5 phòng</option>
                    <option value={10} className="bg-[#1E2738] text-white">10 phòng</option>
                    <option value={20} className="bg-[#1E2738] text-white">20 phòng</option>
                    <option value={50} className="bg-[#1E2738] text-white">50 phòng</option>
                  </select>
                </div>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5 p-1 bg-[#1E2738] rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "table"
                    ? "bg-red-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                title="Bảng"
              >
                <FiLayout className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-red-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                title="Lưới"
              >
                <FiGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
          <div className="flex items-center">
            <FiAlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={() => fetchRooms()}
            className="mt-2 flex items-center gap-1 text-red-600 hover:text-red-800"
          >
            <FiRefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cinema rooms...</p>
        </div>
      ) : (
        <>
          {/* Table View */}
          {viewMode === "table" && (
            <div className="bg-[#161D2F] border border-white/10 rounded-2xl shadow-xl overflow-hidden">
              {filteredRooms.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5 text-gray-300">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                          Tên phòng
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                          Loại
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                          Số ghế
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                          Ghi chú
                        </th>
                        <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-[#161D2F]">
                      {paginatedRooms.map((room) => (
                        <tr
                          key={room.cinema_Room_ID}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-white">
                              #{room.cinema_Room_ID}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-white">
                              {room.room_Name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {room.room_Type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-300 font-medium">
                            {room.seat_Quantity} ghế
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                                room.status === "Active"
                                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                  : room.status === "Inactive"
                                  ? "bg-white/10 text-gray-400 border border-white/10"
                                  : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                              }`}
                            >
                              {room.status === "Active" ? "Hoạt động" : room.status === "Inactive" ? "Tắt" : "Bảo trì"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-400 max-w-xs truncate">
                              {room.notes || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() =>
                                  fetchSeatLayout(room.cinema_Room_ID)
                                }
                                className="text-purple-400 hover:text-purple-300 p-1.5 rounded-lg hover:bg-purple-400/10 transition-colors"
                                title="Xem sơ đồ ghế"
                              >
                                <FiEye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleOpenCreateSeatLayout(
                                    room.cinema_Room_ID
                                  )
                                }
                                className="text-indigo-400 hover:text-indigo-300 p-1.5 rounded-lg hover:bg-indigo-400/10 transition-colors"
                                title="Tạo/Sửa sơ đồ ghế"
                              >
                                <FiLayout className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditRoom(room)}
                                className="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg hover:bg-blue-400/10 transition-colors"
                                title="Sửa phòng"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setConfirmDeleteId(room.cinema_Room_ID)
                                }
                                className={`p-1.5 rounded-lg transition-colors ${
                                  room.hasUpcomingShowtimes
                                    ? "text-gray-600 cursor-not-allowed"
                                    : "text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                }`}
                                disabled={room.hasUpcomingShowtimes}
                                title={
                                  room.hasUpcomingShowtimes
                                    ? "Không thể xóa: Có suất chiếu sắp diễn ra"
                                    : "Xóa phòng"
                                }
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiInfo className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Không tìm thấy phòng chiếu
                  </h3>
                  <p className="text-gray-400">
                    {searchTerm || statusFilter !== "all"
                      ? "Hãy thử tìm kiếm với từ khóa khác"
                      : "Thêm phòng chiếu mới để bắt đầu"}
                  </p>
                </div>
              )}

              {/* Pagination - Table View */}
              {filteredRooms.length > 0 && (
                <div className="px-6 py-4 border-t border-white/10 bg-[#161D2F]">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    roomsPerPage={roomsPerPage}
                    totalRooms={filteredRooms.length}
                  />
                </div>
              )}
            </div>
          )}

          {/* Grid View */}
          {viewMode === "grid" && (
            <>
              {filteredRooms.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedRooms.map((room) => (
                    <div
                      key={room.cinema_Room_ID}
                      className="bg-[#161D2F] rounded-2xl shadow-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all text-white"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3
                            className="text-lg font-bold text-white truncate"
                            title={room.room_Name}
                          >
                            {room.room_Name}
                          </h3>
                          <span
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                              room.status === "Active"
                                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                : room.status === "Inactive"
                                ? "bg-white/10 text-gray-400 border border-white/10"
                                : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                            }`}
                          >
                            {room.status === "Active" ? "Hoạt động" : room.status === "Inactive" ? "Tắt" : "Bảo trì"}
                          </span>
                        </div>

                        <div className="space-y-2 mb-6 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Loại:</span>
                            <span className="font-semibold text-white">
                              {room.room_Type}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Số ghế:</span>
                            <span className="font-semibold text-white">
                              {room.seat_Quantity}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Mã phòng:</span>
                            <span className="font-semibold text-white">
                              #{room.cinema_Room_ID}
                            </span>
                          </div>
                          {room.notes && (
                            <div className="pt-2">
                              <span className="text-gray-400">Ghi chú:</span>
                              <p
                                className="text-gray-300 text-sm mt-1 line-clamp-2"
                                title={room.notes}
                              >
                                {room.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between pt-4 border-t border-white/10">
                          <button
                            onClick={() => fetchSeatLayout(room.cinema_Room_ID)}
                            className="text-purple-400 hover:text-purple-300 p-1.5 rounded-lg hover:bg-purple-400/10 transition-colors"
                            title="Xem sơ đồ ghế"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleOpenCreateSeatLayout(room.cinema_Room_ID)
                            }
                            className="text-indigo-400 hover:text-indigo-300 p-1.5 rounded-lg hover:bg-indigo-400/10 transition-colors"
                            title="Tạo/Sửa sơ đồ ghế"
                          >
                            <FiLayout className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditRoom(room)}
                            className="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg hover:bg-blue-400/10 transition-colors"
                            title="Sửa phòng"
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDeleteId(room.cinema_Room_ID)
                            }
                            className={`p-1.5 rounded-lg transition-colors ${
                              room.hasUpcomingShowtimes
                                ? "text-gray-600 cursor-not-allowed"
                                : "text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            }`}
                            disabled={room.hasUpcomingShowtimes}
                            title={
                              room.hasUpcomingShowtimes
                                ? "Không thể xóa: Có suất chiếu sắp diễn ra"
                                : "Xóa phòng"
                            }
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="col-span-full text-center py-12 bg-[#161D2F] border border-white/10 rounded-2xl shadow-xl">
                  <FiInfo className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Không tìm thấy phòng chiếu
                  </h3>
                  <p className="text-gray-400">
                    {searchTerm || statusFilter !== "all"
                      ? "Hãy thử tìm kiếm với từ khóa khác"
                      : "Thêm phòng chiếu mới để bắt đầu"}
                  </p>
                </div>
              )}

              {/* Pagination - Grid View */}
              {filteredRooms.length > 0 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    roomsPerPage={roomsPerPage}
                    totalRooms={filteredRooms.length}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Add/Edit Room Modal */}
      <Modal isOpen={isAddingRoom || isUpdatingRoom} onClose={handleCloseModal}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2.5 h-6 bg-red-600 rounded-full inline-block"></span>
            {isUpdatingRoom ? "Cập nhật phòng chiếu" : "Thêm phòng chiếu mới"}
          </h2>
          <form onSubmit={isUpdatingRoom ? handleUpdateRoom : handleCreateRoom}>
            {/* Create Mode Selection (only for new rooms) */}
            {!isUpdatingRoom && (
              <div className="mb-5">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Phương thức tạo
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className={`flex-1 py-3 px-4 rounded-xl border transition-all text-sm font-semibold ${
                      createMode === "manual"
                        ? "bg-red-500/15 border-red-500 text-white shadow-md shadow-red-500/10"
                        : "bg-[#0B0F19] border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                    }`}
                    onClick={() => setCreateMode("manual")}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FiEdit2 className="h-4 w-4" />
                      <span>Thủ công (Manual)</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-3 px-4 rounded-xl border transition-all text-sm font-semibold ${
                      createMode === "template"
                        ? "bg-red-500/15 border-red-500 text-white shadow-md shadow-red-500/10"
                        : "bg-[#0B0F19] border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                    }`}
                    onClick={() => setCreateMode("template")}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FiLayout className="h-4 w-4" />
                      <span>Theo mẫu (Template)</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Template Selection (only for template mode) */}
            {!isUpdatingRoom && createMode === "template" && (
              <div className="mb-5">
                <label className="block text-gray-300 text-sm font-medium mb-1.5">
                  Chọn phòng mẫu
                </label>
                <select
                  value={selectedTemplateRoomId?.toString() || ""}
                  onChange={handleTemplateRoomChange}
                  className="w-full p-2.5 bg-[#0B0F19] text-white border border-white/15 rounded-xl focus:outline-none focus:border-red-500 text-sm"
                  required
                >
                  <option value="">-- Chọn phòng mẫu có sẵn --</option>
                  {rooms.map((room) => (
                    <option
                      key={room.cinema_Room_ID}
                      value={room.cinema_Room_ID}
                    >
                      {room.room_Name} ({room.room_Type}, {room.seat_Quantity}{" "}
                      ghế)
                    </option>
                  ))}
                </select>
                {selectedTemplateRoom && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={viewTemplateLayout}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
                    >
                      <FiEye className="h-3.5 w-3.5" /> Xem trước sơ đồ mẫu
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="mb-5">
              <label className="block text-gray-300 text-sm font-medium mb-1.5">
                Tên phòng chiếu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newRoom.room_Name}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, room_Name: e.target.value })
                }
                className="w-full p-2.5 bg-[#0B0F19] text-white border border-white/15 rounded-xl focus:outline-none focus:border-red-500 placeholder-gray-500 text-sm"
                placeholder="VD: Phòng 1 - Standard, Phòng VIP 2"
                required
              />
            </div>

            <div className="mb-5">
              <label className="block text-gray-300 text-sm font-medium mb-1.5">
                Loại phòng <span className="text-red-500">*</span>
              </label>
              <select
                value={newRoom.room_Type}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, room_Type: e.target.value })
                }
                className="w-full p-2.5 bg-[#0B0F19] text-white border border-white/15 rounded-xl focus:outline-none focus:border-red-500 text-sm"
                required
              >
                <option value="2D">2D Standard</option>
                <option value="3D">3D Special</option>
                <option value="IMAX">IMAX</option>
              </select>
            </div>

            {/* Seat Quantity (only for manual mode) */}
            {(isUpdatingRoom || createMode === "manual") && (
              <div className="mb-5">
                <label className="block text-gray-300 text-sm font-medium mb-1.5">
                  Số lượng ghế <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newRoom.seat_Quantity}
                  onChange={(e) =>
                    setNewRoom({
                      ...newRoom,
                      seat_Quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2.5 bg-[#0B0F19] text-white border border-white/15 rounded-xl focus:outline-none focus:border-red-500 placeholder-gray-500 text-sm"
                  min="1"
                  required
                />
              </div>
            )}
            {!isUpdatingRoom && createMode === "template" && (
              <div className="mb-5">
                <label className="block text-gray-300 text-sm font-medium mb-1.5">
                  Số lượng ghế <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newRoom.seat_Quantity}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 cursor-not-allowed text-sm"
                  readOnly
                  disabled
                />
                <p className="mt-1 text-xs text-gray-400">
                  Số lượng ghế tự động đồng bộ theo phòng mẫu được chọn.
                </p>
              </div>
            )}
            <div className="mb-5">
              <label className="block text-gray-300 text-sm font-medium mb-1.5">
                Trạng thái hoạt động <span className="text-red-500">*</span>
              </label>
              <select
                value={newRoom.status}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, status: e.target.value })
                }
                className="w-full p-2.5 bg-[#0B0F19] text-white border border-white/15 rounded-xl focus:outline-none focus:border-red-500 text-sm"
                required
              >
                <option value="Active">Hoạt động (Active)</option>
                <option value="Inactive">Ngừng hoạt động (Inactive)</option>
                <option value="Maintenance">Bảo trì (Maintenance)</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-1.5">
                Ghi chú
              </label>
              <textarea
                value={newRoom.notes}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, notes: e.target.value })
                }
                className="w-full p-2.5 bg-[#0B0F19] text-white border border-white/15 rounded-xl focus:outline-none focus:border-red-500 placeholder-gray-500 text-sm"
                rows={3}
                placeholder="Ghi chú về thiết bị âm thanh, máy chiếu..."
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-500 hover:to-rose-500 transition-all shadow-lg shadow-red-600/20 text-sm font-semibold"
              >
                {isUpdatingRoom ? "Lưu thay đổi" : "Tạo phòng chiếu"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Create Seat Layout Modal */}
      <Modal
        isOpen={isCreatingSeatLayout}
        onClose={() => setIsCreatingSeatLayout(false)}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2.5 h-6 bg-red-600 rounded-full inline-block"></span>
            Thiết lập sơ đồ ghế phòng chiếu
          </h2>
          <form onSubmit={handleCreateSeatLayout}>
            <div className="mb-5">
              <label className="block text-gray-300 text-sm font-medium mb-1.5">
                Dãy hàng ghế (VD: A-J)<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={rowsInput}
                onChange={(e) => setRowsInput(e.target.value)}
                className="w-full p-2.5 bg-[#0B0F19] text-white border border-white/15 rounded-xl focus:outline-none focus:border-red-500 placeholder-gray-500 text-sm font-mono"
                placeholder="Nhập phạm vi hàng (VD: A-J)"
                required
              />
              <p className="mt-1 text-xs text-gray-400">
                Định dạng hàng chữ cái từ bắt đầu đến kết thúc: "A-J"
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-gray-300 text-sm font-medium mb-1.5">
                Số ghế trên mỗi hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={columnsPerRow || ""}
                onChange={(e) =>
                  setColumnsPerRow(parseInt(e.target.value) || 0)
                }
                className="w-full p-2.5 bg-[#0B0F19] text-white border border-white/15 rounded-xl focus:outline-none focus:border-red-500 placeholder-gray-500 text-sm font-mono"
                placeholder="Nhập số cột ghế"
                min="1"
                required
              />
            </div>

            <div className="mb-5">
              <label className="block text-gray-300 text-sm font-medium mb-1.5">
                Loại ghế mặc định
              </label>
              <select
                value={seatType}
                onChange={(e) => setSeatType(e.target.value)}
                className="w-full p-2.5 bg-[#0B0F19] text-white border border-white/15 rounded-xl focus:outline-none focus:border-red-500 text-sm"
              >
                <option value="Regular">Ghế thường (Regular)</option>
                <option value="VIP">Ghế VIP</option>
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-gray-300 text-sm font-medium mb-1.5">
                Cột để trống lối đi (Tùy chọn)
              </label>
              <input
                type="text"
                value={emptyColumnsInput}
                onChange={(e) => setEmptyColumnsInput(e.target.value)}
                className="w-full p-2.5 bg-[#0B0F19] text-white border border-white/15 rounded-xl focus:outline-none focus:border-red-500 placeholder-gray-500 text-sm font-mono"
                placeholder="VD: 0, 5"
              />
              <p className="mt-1 text-xs text-gray-400">
                Nhập số thứ tự cột ghế muốn để trống, cách nhau bằng dấu phẩy "VD: 0, 5"
              </p>
            </div>
            <div className="mb-5">
              <label className="block text-gray-300 text-sm font-medium mb-1.5">
                Trạng thái ghi đè sơ đồ cũ
              </label>
              <div
                className={`w-full p-2.5 rounded-xl font-semibold text-sm text-center border ${
                  overwriteExisting 
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                    : "bg-red-500/20 text-red-300 border-red-500/30"
                }`}
              >
                {overwriteExisting
                  ? "Bật (Ghi đè sơ đồ ghế hiện có)"
                  : "Tắt (Chỉ tạo nếu chưa có sơ đồ)"}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-1.5">
                Thay đổi tùy chọn ghi đè
              </label>
              <button
                type="button"
                onClick={() => setOverwriteExisting(!overwriteExisting)}
                className="w-full p-2.5 rounded-xl bg-[#1E2738] hover:bg-white/10 text-white font-medium text-sm border border-white/10 transition-colors"
              >
                {overwriteExisting ? "Tắt ghi đè sơ đồ" : "Bật ghi đè sơ đồ"}
              </button>
            </div>

            <SeatLayoutInfoDisplay />

            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsCreatingSeatLayout(false)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors flex items-center"
              >
                <FiX className="mr-1.5" />
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-500 hover:to-rose-500 transition-all shadow-lg shadow-red-600/20 text-sm font-semibold flex items-center"
              >
                <FiCheck className="mr-1.5" /> Tạo sơ đồ ghế
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
      >
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400">
            <FiAlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Xác nhận xóa phòng chiếu
          </h2>
          <p className="text-gray-300 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
            Bạn có chắc chắn muốn xóa phòng chiếu này không? Hành động này sẽ xóa toàn bộ sơ đồ ghế liên quan và không thể hoàn tác.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={() =>
                confirmDeleteId && handleDeleteRoom(confirmDeleteId)
              }
              className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-500 hover:to-rose-500 transition-all shadow-lg shadow-red-600/20 text-sm font-semibold"
            >
              Xác nhận xóa
            </button>
          </div>
        </div>
      </Modal>

      {/* Seat Layout Viewing Modal */}
      <Modal
        isOpen={isViewingSeatLayout}
        onClose={handleCloseSeatLayoutModal}
        size="xl"
      >
        <ModalContent>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-6 bg-red-600 rounded-full inline-block"></span>
                {isViewingTemplateLayout
                  ? `${seatLayout?.cinema_room.room_Name} - Sơ đồ mẫu (Chỉ xem)`
                  : `${seatLayout?.cinema_room.room_Name} - Sơ đồ ghế`}
              </h2>
              <div className="flex gap-2">
                {/* Chỉ hiển thị các nút tương tác khi KHÔNG phải đang xem template */}
                {!isViewingTemplateLayout && (
                  <>
                    <button
                      onClick={() => setIsBulkSelecting(!isBulkSelecting)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isBulkSelecting
                          ? "bg-red-500/20 text-red-300 border border-red-500/30 shadow-sm"
                          : "bg-[#1E2738] text-gray-300 border border-white/10 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {isBulkSelecting ? (
                        <>
                          <FiCheckSquare className="h-4 w-4" />
                          Thoát chọn nhiều
                        </>
                      ) : (
                        <>
                          <FiSquare className="h-4 w-4" />
                          Chọn nhiều ghế
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDeleteSeatLayout}
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-xl text-xs font-semibold border border-red-500/30 hover:bg-red-500/20 flex items-center gap-1.5 transition-colors"
                    >
                      <FiTrash2 className="h-4 w-4" />
                      Xóa sơ đồ ghế
                    </button>
                  </>
                )}
                <button
                  onClick={handleCloseSeatLayoutModal}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            </div>

            {isLoadingSeatLayout ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
                <p className="text-gray-400 text-sm">Đang tải sơ đồ ghế...</p>
              </div>
            ) : seatLayout ? (
              <>
                {/* Bulk Actions - Chỉ hiển thị khi KHÔNG phải đang xem template */}
                {isBulkSelecting && !isViewingTemplateLayout && (
                  <BulkActions>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">
                        Đã chọn: <strong className="text-red-400">{selectedSeats.length}</strong> ghế
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase text-gray-400">Loại:</span>
                      <BulkActionSelect
                        value={bulkSeatType}
                        onChange={(e) => setBulkSeatType(e.target.value)}
                      >
                        <option value="Regular">Thường (Regular)</option>
                        <option value="VIP">VIP</option>
                      </BulkActionSelect>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase text-gray-400">Trạng thái:</span>
                      <BulkActionSelect
                        value={bulkIsActive.toString()}
                        onChange={(e) =>
                          setBulkIsActive(e.target.value === "true")
                        }
                      >
                        <option value="true">Hoạt động (Active)</option>
                        <option value="false">Khóa (Inactive)</option>
                      </BulkActionSelect>
                    </div>
                    <BulkActionButton
                      onClick={bulkUpdateSeats}
                      disabled={selectedSeats.length === 0}
                    >
                      Cập nhật hàng loạt
                    </BulkActionButton>
                  </BulkActions>
                )}

                {/* Seat Layout */}
                <div className="flex flex-col items-center">
                  <Screen>
                    <ScreenText>SCREEN</ScreenText>
                  </Screen>

                  <ScrollableSeatingArea>
                    <SeatingArea>
                      {/* Column Headers */}
                      <div></div> {/* Empty space for alignment */}
                      <ColumnHeader columns={seatLayout.dimensions.columns}>
                        {Array.from(
                          { length: seatLayout.dimensions.columns },
                          (_, i) => i + 1
                        ).map((col) => (
                          <ColumnLabel
                            key={`header-${col}`}
                            onClick={
                              !isViewingTemplateLayout
                                ? () => handleColumnSelect(col)
                                : undefined
                            }
                            style={{
                              cursor:
                                isBulkSelecting && !isViewingTemplateLayout
                                  ? "pointer"
                                  : "default",
                              backgroundColor:
                                isBulkSelecting && !isViewingTemplateLayout
                                  ? seatLayout.rows.$values
                                      .flatMap((row) =>
                                        row.seats.$values.filter(
                                          (seat) => seat.column_Number === col
                                        )
                                      )
                                      .every((seat) =>
                                        selectedSeats.includes(seat.layout_ID)
                                      )
                                    ? "#93c5fd" // All selected - highlight
                                    : seatLayout.rows.$values
                                        .flatMap((row) =>
                                          row.seats.$values.filter(
                                            (seat) => seat.column_Number === col
                                          )
                                        )
                                        .some((seat) =>
                                          selectedSeats.includes(seat.layout_ID)
                                        )
                                    ? "#bfdbfe" // Some selected - light highlight
                                    : "#e5e7eb" // None selected - default
                                  : "#e5e7eb",
                            }}
                          >
                            {col}
                          </ColumnLabel>
                        ))}
                      </ColumnHeader>
                      <div></div> {/* Empty space for alignment */}
                      {/* Rows with Seats */}
                      {seatLayout.rows.$values.map((row, rowIndex) => (
                        <RowContainer
                          key={`row-${row.row}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: rowIndex * 0.05 }}
                        >
                          <RowLabel
                            onClick={
                              !isViewingTemplateLayout
                                ? () => handleRowSelect(row)
                                : undefined
                            }
                            style={{
                              cursor:
                                isBulkSelecting && !isViewingTemplateLayout
                                  ? "pointer"
                                  : "default",
                              backgroundColor:
                                isBulkSelecting && !isViewingTemplateLayout
                                  ? row.seats.$values.every((seat) =>
                                      selectedSeats.includes(seat.layout_ID)
                                    )
                                    ? "#93c5fd" // All selected - highlight
                                    : row.seats.$values.some((seat) =>
                                        selectedSeats.includes(seat.layout_ID)
                                      )
                                    ? "#bfdbfe" // Some selected - light highlight
                                    : "#e5e7eb" // None selected - default
                                  : "#e5e7eb",
                            }}
                          >
                            {row.row}
                          </RowLabel>

                          <SeatsSection columns={seatLayout.dimensions.columns}>
                            {Array.from(
                              { length: seatLayout.dimensions.columns },
                              (_, i) => i + 1
                            ).map((col) => {
                              const seat = row.seats.$values.find(
                                (s) => s.column_Number === col
                              );

                              if (!seat) {
                                return (
                                  <div
                                    key={`empty-${row.row}-${col}`}
                                    className="w-10 h-10"
                                  ></div>
                                );
                              }

                              const isSelected = selectedSeats.includes(
                                seat.layout_ID
                              );

                              return (
                                <SeatButtonWrapper
                                  key={`seat-${seat.layout_ID}`}
                                >
                                  <SeatButton
                                    seatType={seat.seat_Type}
                                    isActive={seat.is_Active}
                                    isSelected={isSelected}
                                    onClick={
                                      !isViewingTemplateLayout
                                        ? () => handleSeatClick(seat)
                                        : undefined
                                    }
                                    whileHover={
                                      !isViewingTemplateLayout
                                        ? { scale: 1.05 }
                                        : {}
                                    }
                                    whileTap={
                                      !isViewingTemplateLayout
                                        ? { scale: 0.95 }
                                        : {}
                                    }
                                    style={{
                                      cursor: isViewingTemplateLayout
                                        ? "default"
                                        : "pointer",
                                    }}
                                  >
                                    <SeatNumber>{col}</SeatNumber>
                                  </SeatButton>
                                  <Tooltip>
                                    {seat.row_Label}
                                    {seat.column_Number} - {seat.seat_Type}
                                    <br />
                                    {seat.is_Active ? "Active" : "Inactive"}
                                    {seatPricesMap[seat.layout_ID] !==
                                      undefined && (
                                      <>
                                        <br />
                                        {seatPricesMap[
                                          seat.layout_ID
                                        ].toLocaleString("vi-VN")}{" "}
                                        VND
                                      </>
                                    )}
                                  </Tooltip>
                                </SeatButtonWrapper>
                              );
                            })}
                          </SeatsSection>

                          <RowLabel
                            onClick={
                              !isViewingTemplateLayout
                                ? () => handleRowSelect(row)
                                : undefined
                            }
                            style={{
                              cursor:
                                isBulkSelecting && !isViewingTemplateLayout
                                  ? "pointer"
                                  : "default",
                              backgroundColor:
                                isBulkSelecting && !isViewingTemplateLayout
                                  ? row.seats.$values.every((seat) =>
                                      selectedSeats.includes(seat.layout_ID)
                                    )
                                    ? "#93c5fd" // All selected - highlight
                                    : row.seats.$values.some((seat) =>
                                        selectedSeats.includes(seat.layout_ID)
                                      )
                                    ? "#bfdbfe" // Some selected - light highlight
                                    : "#e5e7eb" // None selected - default
                                  : "#e5e7eb",
                            }}
                          >
                            {row.row}
                          </RowLabel>
                        </RowContainer>
                      ))}
                      {/* Column Footers */}
                      <div></div> {/* Empty space for alignment */}
                      <ColumnFooter columns={seatLayout.dimensions.columns}>
                        {Array.from(
                          { length: seatLayout.dimensions.columns },
                          (_, i) => i + 1
                        ).map((col) => (
                          <ColumnLabel
                            key={`footer-${col}`}
                            onClick={
                              !isViewingTemplateLayout
                                ? () => handleColumnSelect(col)
                                : undefined
                            }
                            style={{
                              cursor:
                                isBulkSelecting && !isViewingTemplateLayout
                                  ? "pointer"
                                  : "default",
                              backgroundColor:
                                isBulkSelecting && !isViewingTemplateLayout
                                  ? seatLayout.rows.$values
                                      .flatMap((row) =>
                                        row.seats.$values.filter(
                                          (seat) => seat.column_Number === col
                                        )
                                      )
                                      .every((seat) =>
                                        selectedSeats.includes(seat.layout_ID)
                                      )
                                    ? "#93c5fd" // All selected - highlight
                                    : seatLayout.rows.$values
                                        .flatMap((row) =>
                                          row.seats.$values.filter(
                                            (seat) => seat.column_Number === col
                                          )
                                        )
                                        .some((seat) =>
                                          selectedSeats.includes(seat.layout_ID)
                                        )
                                    ? "#bfdbfe" // Some selected - light highlight
                                    : "#e5e7eb" // None selected - default
                                  : "#e5e7eb",
                            }}
                          >
                            {col}
                          </ColumnLabel>
                        ))}
                      </ColumnFooter>
                      <div></div> {/* Empty space for alignment */}
                    </SeatingArea>
                  </ScrollableSeatingArea>

                  {/* Seat Legend */}
                  <SeatLegend>
                    <LegendItem>
                      <ColorBox color="#3b82f6" />
                      <span>Regular</span>
                    </LegendItem>
                    <LegendItem>
                      <ColorBox color="#ef4444" />
                      <span>VIP</span>
                    </LegendItem>
                    <LegendItem>
                      <ColorBox color="#9ca3af" />
                      <span>Inactive</span>
                    </LegendItem>
                    {isBulkSelecting && !isViewingTemplateLayout && (
                      <LegendItem>
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            backgroundColor: "#3b82f6",
                            borderRadius: "4px",
                            border: "3px solid #22c55e",
                            boxShadow: "0 0 5px rgba(34, 197, 94, 0.5)",
                          }}
                        />
                        <span>Selected</span>
                      </LegendItem>
                    )}
                  </SeatLegend>

                  {/* Room Stats */}
                  <div className="mt-6 bg-[#1E2738] border border-white/10 p-5 rounded-2xl w-full max-w-md shadow-xl">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                      <FiGrid className="text-red-500" />
                      Thống kê sơ đồ phòng chiếu
                    </h3>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="p-3 bg-[#0B0F19]/60 rounded-xl border border-white/5">
                        <p className="text-xs text-gray-400">Tổng số ghế</p>
                        <p className="text-lg font-bold text-white mt-0.5">
                          {seatLayout.stats.total_seats}
                        </p>
                      </div>
                      <div className="p-3 bg-[#0B0F19]/60 rounded-xl border border-white/5">
                        <p className="text-xs text-gray-400">Kích thước</p>
                        <p className="text-lg font-bold text-white mt-0.5">
                          {seatLayout.dimensions.rows} × {seatLayout.dimensions.columns}
                        </p>
                      </div>
                      {seatLayout.stats.seat_types.$values.map((type) => (
                        <div key={type.seatType} className="p-3 bg-[#0B0F19]/60 rounded-xl border border-white/5">
                          <p className="text-xs text-gray-400">
                            Ghế {type.seatType}
                          </p>
                          <p className="text-lg font-bold text-red-400 mt-0.5">
                            {type.count}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Thông báo khi đang xem template */}
                  {isViewingTemplateLayout && (
                    <div className="mt-4 p-3.5 bg-blue-500/10 text-blue-300 rounded-xl border border-blue-500/30 w-full max-w-md text-xs leading-relaxed flex items-center">
                      <FiInfo className="h-5 w-5 mr-2.5 shrink-0 text-blue-400" />
                      <p>
                        Đây là chế độ xem sơ đồ mẫu. Bạn không thể chỉnh sửa hoặc xóa sơ đồ này.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <FiAlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">
                  Chưa có sơ đồ ghế
                </h3>
                <p className="text-gray-400 text-sm">
                  Phòng chiếu này chưa được tạo sơ đồ ghế. Hãy tạo mới để bắt đầu xếp lịch chiếu.
                </p>
              </div>
            )}
          </div>
        </ModalContent>
      </Modal>

      {/* Seat Price Modal */}
      <Modal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        size="sm"
      >
        <PriceModalContent>
          {selectedSeat && (
            <>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-center gap-2">
                <span className="w-2 h-5 bg-red-600 rounded-full inline-block"></span>
                Ghế {selectedSeat.row_Label}{selectedSeat.column_Number}
              </h3>

              <div className="mb-5 text-left p-3.5 bg-[#0B0F19]/60 rounded-xl border border-white/10 space-y-2.5 text-sm">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Loại ghế:</span>
                  <span className="font-semibold text-white">{selectedSeat.seat_Type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Trạng thái:</span>
                  <span
                    className={`font-semibold ${
                      selectedSeat.is_Active ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {selectedSeat.is_Active ? "Đang hoạt động" : "Khóa / Không dùng"}
                  </span>
                </div>
                <div className="flex justify-between py-1 items-center">
                  <span className="text-gray-400">Giá cơ sở:</span>
                  <div className="font-bold text-red-400">
                    {seatPrice !== null
                      ? `${seatPrice.toLocaleString("vi-VN")} VND`
                      : "Chưa cấu hình"}
                  </div>
                </div>
              </div>

              <ActionButtons>
                <CancelButton onClick={() => setIsPriceModalOpen(false)} className="rounded-xl">
                  Đóng
                </CancelButton>
                <ConfirmButton
                  onClick={() => {
                    updateSeatStatus(
                      selectedSeat.layout_ID,
                      selectedSeat.is_Active
                    );
                    setIsPriceModalOpen(false);
                  }}
                  className="rounded-xl"
                >
                  {selectedSeat.is_Active ? "Khóa ghế này" : "Mở khóa ghế"}
                </ConfirmButton>
              </ActionButtons>
            </>
          )}
        </PriceModalContent>
      </Modal>
      </div>
    </div>
  );
};

// Component phân trang cải tiến
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  roomsPerPage,
  totalRooms,
}) => {
  const pageNumbers = [];

  // Hiển thị tối đa 5 số trang
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 text-white">
      <div>
        <p className="text-sm text-gray-400">
          Hiển thị{" "}
          <span className="font-semibold text-white">
            {Math.min(totalRooms, (currentPage - 1) * roomsPerPage + 1)}
          </span>{" "}
          đến{" "}
          <span className="font-semibold text-white">
            {Math.min(currentPage * roomsPerPage, totalRooms)}
          </span>{" "}
          trong <span className="font-semibold text-white">{totalRooms}</span> phòng
        </p>
      </div>
      <div className="flex items-center">
        <nav
          className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px overflow-hidden border border-white/10"
          aria-label="Pagination"
        >
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-3 py-2 bg-[#1E2738] text-sm font-medium transition-colors ${
              currentPage === 1
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-300 hover:bg-white/10"
            }`}
            aria-label="First page"
          >
            <span className="sr-only">First</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-3 py-2 bg-[#1E2738] border-l border-white/10 text-sm font-medium transition-colors ${
              currentPage === 1
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-300 hover:bg-white/10"
            }`}
            aria-label="Previous page"
          >
            <span className="sr-only">Previous</span>
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {startPage > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="relative inline-flex items-center px-3.5 py-2 bg-[#1E2738] border-l border-white/10 text-sm font-medium text-gray-300 hover:bg-white/10"
              >
                1
              </button>
              {startPage > 2 && (
                <span className="relative inline-flex items-center px-3 py-2 bg-[#1E2738] border-l border-white/10 text-sm font-medium text-gray-500">
                  ...
                </span>
              )}
            </>
          )}

          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => onPageChange(number)}
              className={`relative inline-flex items-center px-3.5 py-2 text-sm font-medium transition-colors ${
                currentPage === number
                  ? "z-10 bg-red-600 text-white"
                  : "bg-[#1E2738] border-l border-white/10 text-gray-300 hover:bg-white/10"
              }`}
            >
              {number}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="relative inline-flex items-center px-3 py-2 bg-[#1E2738] border-l border-white/10 text-sm font-medium text-gray-500">
                  ...
                </span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className="relative inline-flex items-center px-3.5 py-2 bg-[#1E2738] border-l border-white/10 text-sm font-medium text-gray-300 hover:bg-white/10"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`relative inline-flex items-center px-3 py-2 bg-[#1E2738] border-l border-white/10 text-sm font-medium transition-colors ${
              currentPage === totalPages
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-300 hover:bg-white/10"
            }`}
            aria-label="Next page"
          >
            <span className="sr-only">Next</span>
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`relative inline-flex items-center px-3 py-2 bg-[#1E2738] border-l border-white/10 text-sm font-medium transition-colors ${
              currentPage === totalPages
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-300 hover:bg-white/10"
            }`}
            aria-label="Last page"
          >
            <span className="sr-only">Last</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 15.707a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L8.586 10l-4.293 4.293a1 1 0 000 1.414zm6 0a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L14.586 10l-4.293 4.293a1 1 0 000 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default ManageCinemaRoomPage;
