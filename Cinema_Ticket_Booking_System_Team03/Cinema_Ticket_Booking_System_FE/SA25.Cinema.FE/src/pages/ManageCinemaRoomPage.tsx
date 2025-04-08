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
    content: "";
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
        "https://localhost:7168/api/SeatLayout/seat-types",
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
      const response = await axios.get("https://localhost:7168/api/CinemaRoom");
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
        `https://localhost:7168/api/SeatLayout/room/${roomId}`,
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
      // const response = await axios.delete(`https://localhost:7168/api/SeatLayout/room/${roomIdToDelete}`, {
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
      await axios.delete("https://localhost:7168/api/SeatLayout/bulk-delete", {
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
        `https://localhost:7168/api/SeatLayout/seat/${layoutId}`,
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
        "https://localhost:7168/api/SeatLayout/bulk-update",
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
          "https://localhost:7168/api/SeatLayout/create-room-with-layout",
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
          "https://localhost:7168/api/CinemaRoom",
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
        `https://localhost:7168/api/CinemaRoom/${currentRoomId}`,
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
      await axios.delete(`https://localhost:7168/api/CinemaRoom/${id}`, {
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
        `https://localhost:7168/api/SeatLayout/bulk/${currentRoomId}`,
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
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={5000} />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Cinema Room Management
          </h1>
          <p className="text-gray-600">
            Create and manage cinema rooms and their seating layouts
          </p>
        </div>
        <button
          onClick={handleAddRoom}
          className="mt-4 md:mt-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-md"
        >
          <FiPlus className="h-5 w-5" />
          Add New Room
        </button>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-grow">
            {/* Search Input */}
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <FiSearch className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="min-w-[200px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            {/* Rooms Per Page */}
            <div className="min-w-[150px]">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">
                  Rooms per page:
                </label>
                <select
                  value={roomsPerPage}
                  onChange={handleRoomsPerPageChange}
                  className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg ${
                viewMode === "table"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title="Table View"
            >
              <FiLayout className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg ${
                viewMode === "grid"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title="Grid View"
            >
              <FiGrid className="h-5 w-5" />
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
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {filteredRooms.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Room Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seats
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedRooms.map((room) => (
                        <tr
                          key={room.cinema_Room_ID}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {room.cinema_Room_ID}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {room.room_Name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {room.room_Type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {room.seat_Quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                room.status === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : room.status === "Inactive"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {room.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {room.notes || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() =>
                                  fetchSeatLayout(room.cinema_Room_ID)
                                }
                                className="text-purple-600 hover:text-purple-900 p-1"
                                title="View Seat Layout"
                              >
                                <FiEye className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleOpenCreateSeatLayout(
                                    room.cinema_Room_ID
                                  )
                                }
                                className="text-indigo-600 hover:text-indigo-900 p-1"
                                title="Create/Edit Seat Layout"
                              >
                                <FiLayout className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleEditRoom(room)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Edit Room"
                              >
                                <FiEdit2 className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() =>
                                  setConfirmDeleteId(room.cinema_Room_ID)
                                }
                                className={`p-1 ${
                                  room.hasUpcomingShowtimes
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-red-600 hover:text-red-900"
                                }`}
                                disabled={room.hasUpcomingShowtimes}
                                title={
                                  room.hasUpcomingShowtimes
                                    ? "Cannot delete: Room has upcoming showtimes"
                                    : "Delete Room"
                                }
                              >
                                <FiTrash2 className="h-5 w-5" />
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
                  <FiInfo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No rooms found
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Add a new cinema room to get started"}
                  </p>
                </div>
              )}

              {/* Pagination - Table View */}
              {filteredRooms.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200">
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
                      className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3
                            className="text-lg font-semibold text-gray-900 truncate"
                            title={room.room_Name}
                          >
                            {room.room_Name}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              room.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : room.status === "Inactive"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {room.status}
                          </span>
                        </div>

                        <div className="space-y-2 mb-6">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Type:</span>
                            <span className="font-medium text-gray-900">
                              {room.room_Type}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Seats:</span>
                            <span className="font-medium text-gray-900">
                              {room.seat_Quantity}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">ID:</span>
                            <span className="font-medium text-gray-900">
                              {room.cinema_Room_ID}
                            </span>
                          </div>
                          {room.notes && (
                            <div className="pt-2">
                              <span className="text-gray-500">Notes:</span>
                              <p
                                className="text-gray-700 text-sm mt-1 line-clamp-2"
                                title={room.notes}
                              >
                                {room.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between pt-4 border-t border-gray-200">
                          <button
                            onClick={() => fetchSeatLayout(room.cinema_Room_ID)}
                            className="text-purple-600 hover:text-purple-900 p-1"
                            title="View Seat Layout"
                          >
                            <FiEye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              handleOpenCreateSeatLayout(room.cinema_Room_ID)
                            }
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                            title="Create/Edit Seat Layout"
                          >
                            <FiLayout className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleEditRoom(room)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Edit Room"
                          >
                            <FiEdit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDeleteId(room.cinema_Room_ID)
                            }
                            className={`p-1 ${
                              room.hasUpcomingShowtimes
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-red-600 hover:text-red-900"
                            }`}
                            disabled={room.hasUpcomingShowtimes}
                            title={
                              room.hasUpcomingShowtimes
                                ? "Cannot delete: Room has upcoming showtimes"
                                : "Delete Room"
                            }
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-md">
                  <FiInfo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No rooms found
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Add a new cinema room to get started"}
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {isUpdatingRoom ? "Update Cinema Room" : "Add New Cinema Room"}
          </h2>
          <form onSubmit={isUpdatingRoom ? handleUpdateRoom : handleCreateRoom}>
            {/* Create Mode Selection (only for new rooms) */}
            {!isUpdatingRoom && (
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Creation Method
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    className={`flex-1 py-3 px-4 rounded-lg border ${
                      createMode === "manual"
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-white border-gray-300 text-gray-700"
                    }`}
                    onClick={() => setCreateMode("manual")}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FiEdit2 className="h-5 w-5" />
                      <span>Manual Setup</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-3 px-4 rounded-lg border ${
                      createMode === "template"
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-white border-gray-300 text-gray-700"
                    }`}
                    onClick={() => setCreateMode("template")}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FiLayout className="h-5 w-5" />
                      <span>From Template</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Template Selection (only for template mode) */}
            {!isUpdatingRoom && createMode === "template" && (
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Select Template Room
                </label>
                <select
                  value={selectedTemplateRoomId?.toString() || ""}
                  onChange={handleTemplateRoomChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- Select a room template --</option>
                  {rooms.map((room) => (
                    <option
                      key={room.cinema_Room_ID}
                      value={room.cinema_Room_ID}
                    >
                      {room.room_Name} ({room.room_Type}, {room.seat_Quantity}{" "}
                      seats)
                    </option>
                  ))}
                </select>
                {selectedTemplateRoom && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={viewTemplateLayout}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <FiEye className="h-4 w-4" /> View template layout
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Room Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newRoom.room_Name}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, room_Name: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter room name"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Room Type <span className="text-red-500">*</span>
              </label>
              <select
                value={newRoom.room_Type}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, room_Type: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              >
                <option value="2D">2D</option>
                <option value="3D">3D</option>
                <option value="IMAX">IMAX</option>
              </select>
            </div>

            {/* Seat Quantity (only for manual mode) */}
            {(isUpdatingRoom || createMode === "manual") && (
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Seat Quantity <span className="text-red-500">*</span>
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  min="1"
                  required
                />
              </div>
            )}
            {!isUpdatingRoom && createMode === "template" && (
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Seat Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newRoom.seat_Quantity}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  readOnly
                  disabled
                />
                <p className="mt-1 text-sm text-gray-500">
                  Seat quantity is automatically set based on the selected
                  template.
                </p>
              </div>
            )}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={newRoom.status}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, status: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Notes
              </label>
              <textarea
                value={newRoom.notes}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, notes: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={3}
                placeholder="Optional notes about this room"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isUpdatingRoom ? "Update Room" : "Create Room"}
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Create Seat Layout
          </h2>
          <form onSubmit={handleCreateSeatLayout}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Row Labels (e.g., A-Z)<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={rowsInput}
                onChange={(e) => setRowsInput(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter row range (e.g., A-Z)"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter row labels separated in format "A-Z"
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Columns Per Row <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={columnsPerRow || ""}
                onChange={(e) =>
                  setColumnsPerRow(parseInt(e.target.value) || 0)
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter number of columns"
                min="1"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Default Seat Type
              </label>
              <select
                value={seatType}
                onChange={(e) => setSeatType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Regular">Regular</option>
                <option value="VIP">VIP</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Empty Columns (Optional)
              </label>
              <input
                type="text"
                value={emptyColumnsInput}
                onChange={(e) => setEmptyColumnsInput(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g., 0,2,5"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter column numbers to leave empty, separated by commas "e.g.,
                0,2,5"
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Overwrite Existing Layout Status
              </label>
              <div
                className={`w-full p-3 rounded-lg font-medium text-white text-center ${
                  overwriteExisting ? "bg-green-500" : "bg-red-500"
                }`}
              >
                {overwriteExisting
                  ? "Enabled (Overwrite Existing Layout)"
                  : "Disabled (Create New Layout)"}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Change Overwrite Existing Layout
              </label>
              <button
                type="button"
                onClick={() => setOverwriteExisting(!overwriteExisting)}
                className="w-full p-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
              >
                {overwriteExisting ? "Disable Overwrite" : "Enable Overwrite"}
              </button>
              <p className="mt-1 text-sm text-gray-500">
                Click this button to toggle the overwrite option.
              </p>
            </div>

            <SeatLayoutInfoDisplay />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreatingSeatLayout(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {" "}
                <FiX className="mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FiCheck className="mr-2" /> Create Layout
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
        <div className="p-6">
          <div className="flex items-center justify-center mb-4 text-red-500">
            <FiAlertTriangle className="h-12 w-12" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
            Confirm Deletion
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            Are you sure you want to delete this cinema room? This action cannot
            be undone.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                confirmDeleteId && handleDeleteRoom(confirmDeleteId)
              }
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
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
              <h2 className="text-xl font-semibold text-gray-900">
                {isViewingTemplateLayout
                  ? `${seatLayout?.cinema_room.room_Name} - Template Layout (View Only)`
                  : `${seatLayout?.cinema_room.room_Name} - Seat Layout`}
              </h2>
              <div className="flex gap-2">
                {/* Chỉ hiển thị các nút tương tác khi KHÔNG phải đang xem template */}
                {!isViewingTemplateLayout && (
                  <>
                    <button
                      onClick={() => setIsBulkSelecting(!isBulkSelecting)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                        isBulkSelecting
                          ? "bg-blue-100 text-blue-700 border border-blue-300"
                          : "bg-gray-100 text-gray-700 border border-gray-300"
                      }`}
                    >
                      {isBulkSelecting ? (
                        <>
                          <FiCheckSquare className="h-4 w-4" />
                          Exit Selection
                        </>
                      ) : (
                        <>
                          <FiSquare className="h-4 w-4" />
                          Bulk Select
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDeleteSeatLayout}
                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-300 flex items-center gap-1.5"
                    >
                      <FiTrash2 className="h-4 w-4" />
                      Delete Layout
                    </button>
                  </>
                )}
                <button
                  onClick={handleCloseSeatLayoutModal}
                  className="p-1.5 text-gray-500 hover:text-gray-700"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            </div>

            {isLoadingSeatLayout ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading seat layout...</p>
              </div>
            ) : seatLayout ? (
              <>
                {/* Bulk Actions - Chỉ hiển thị khi KHÔNG phải đang xem template */}
                {isBulkSelecting && !isViewingTemplateLayout && (
                  <BulkActions>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700 font-medium">
                        {selectedSeats.length} seats selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">Type:</span>
                      <BulkActionSelect
                        value={bulkSeatType}
                        onChange={(e) => setBulkSeatType(e.target.value)}
                      >
                        <option value="Regular">Regular</option>
                        <option value="VIP">VIP</option>
                      </BulkActionSelect>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">Status:</span>
                      <BulkActionSelect
                        value={bulkIsActive.toString()}
                        onChange={(e) =>
                          setBulkIsActive(e.target.value === "true")
                        }
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </BulkActionSelect>
                    </div>
                    <BulkActionButton
                      onClick={bulkUpdateSeats}
                      disabled={selectedSeats.length === 0}
                    >
                      Update Seats
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
                  <div className="mt-6 bg-gray-50 p-4 rounded-lg w-full max-w-md">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Room Statistics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Total Seats</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {seatLayout.stats.total_seats}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Dimensions</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {seatLayout.dimensions.rows} ×{" "}
                          {seatLayout.dimensions.columns}
                        </p>
                      </div>
                      {seatLayout.stats.seat_types.$values.map((type) => (
                        <div key={type.seatType}>
                          <p className="text-sm text-gray-500">
                            {type.seatType} Seats
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {type.count}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Thông báo khi đang xem template */}
                  {isViewingTemplateLayout && (
                    <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md border border-blue-200 w-full max-w-md">
                      <div className="flex items-center">
                        <FiInfo className="h-5 w-5 mr-2" />
                        <p>
                          This is a template view only. You cannot modify or
                          delete this layout.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <FiAlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No seat layout found
                </h3>
                <p className="text-gray-500">
                  This room doesn't have a seat layout yet. Create one to get
                  started.
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Seat {selectedSeat.row_Label}
                {selectedSeat.column_Number}
              </h3>

              <div className="mb-4 text-left">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{selectedSeat.seat_Type}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`font-medium ${
                      selectedSeat.is_Active ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {selectedSeat.is_Active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Price:</span>
                  <PriceDisplay>
                    <FiDollarSign className="h-5 w-5 text-gray-500" />
                    <span>
                      {seatPrice !== null
                        ? `${seatPrice.toLocaleString("vi-VN")} VND`
                        : "N/A"}
                    </span>
                  </PriceDisplay>
                </div>
              </div>

              <ActionButtons>
                <CancelButton onClick={() => setIsPriceModalOpen(false)}>
                  Close
                </CancelButton>
                <ConfirmButton
                  onClick={() => {
                    updateSeatStatus(
                      selectedSeat.layout_ID,
                      selectedSeat.is_Active
                    );
                    setIsPriceModalOpen(false);
                  }}
                >
                  {selectedSeat.is_Active ? "Deactivate" : "Activate"} Seat
                </ConfirmButton>
              </ActionButtons>
            </>
          )}
        </PriceModalContent>
      </Modal>
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm text-gray-700">
          Showing{" "}
          <span className="font-medium">
            {Math.min(totalRooms, (currentPage - 1) * roomsPerPage + 1)}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {Math.min(currentPage * roomsPerPage, totalRooms)}
          </span>{" "}
          of <span className="font-medium">{totalRooms}</span> rooms
        </p>
      </div>
      <div className="flex items-center">
        <nav
          className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
          aria-label="Pagination"
        >
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
              currentPage === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-500 hover:bg-gray-50"
            }`}
            aria-label="First page"
          >
            <span className="sr-only">First</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
            className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
              currentPage === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-500 hover:bg-gray-50"
            }`}
            aria-label="Previous page"
          >
            <span className="sr-only">Previous</span>
            <svg
              className="h-5 w-5"
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
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                1
              </button>
              {startPage > 2 && (
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  ...
                </span>
              )}
            </>
          )}

          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => onPageChange(number)}
              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                currentPage === number
                  ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {number}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  ...
                </span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
              currentPage === totalPages
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-500 hover:bg-gray-50"
            }`}
            aria-label="Next page"
          >
            <span className="sr-only">Next</span>
            <svg
              className="h-5 w-5"
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
            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
              currentPage === totalPages
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-500 hover:bg-gray-50"
            }`}
            aria-label="Last page"
          >
            <span className="sr-only">Last</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
