import { useEffect, useState } from "react";
import "./App.css";
import InventoryPage from "./InventoryPage";
import SupplierPage from "./SupplierPage";
import ExceptionPage from "./ExceptionPage";


const API_URL = "http://localhost:5000/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  unitPrice: number;
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product: Product;
}

interface Shipment {
  id: string;
  orderId: string;
  supplierId?: string | null;
  status: string;
  expectedDate: string;
  actualDate?: string | null;
  trackingNumber?: string | null;
  createdAt: string;
  order?: {
    id: string;
    status: string;
    totalAmount: number;
    customer?: {
      id: string;
      name: string;
      email: string;
    };
    items?: OrderItem[];
  };
  supplier?: {
    id: string;
    name: string;
  } | null;
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  orderDate: string;
  promisedDate: string;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  items?: OrderItem[];
  shipments?: Shipment[];
}

interface RiskAnalysis {
  id: string;
  orderId: string;
  event: string;
  riskScore: number;
  severity:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";
  factors: string[];
  recommendations: string[];
  createdAt: string;
}

type Page =
  | "dashboard"
  | "orders"
  | "shipments"
  | "inventory"
  | "suppliers"
  | "exceptions"
  | "risk";

const shipmentStatuses = [
  "PENDING",
  "IN_TRANSIT",
  "DELIVERED",
  "DELAYED",
  "CANCELLED",
];

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("token") || ""
  );

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) return null;

    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [activePage, setActivePage] =
    useState<Page>("dashboard");

  const [orders, setOrders] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<
    Shipment[]
  >([]);

  const [selectedOrderId, setSelectedOrderId] =
    useState("");

  const [selectedShipmentId, setSelectedShipmentId] =
    useState("");

  const [analyses, setAnalyses] = useState<
    RiskAnalysis[]
  >([]);

  const [orderSearch, setOrderSearch] = useState("");
  const [shipmentSearch, setShipmentSearch] =
    useState("");

  const [shipmentStatus, setShipmentStatus] =
    useState("");

  const [loginLoading, setLoginLoading] =
    useState(false);

  const [dashboardLoading, setDashboardLoading] =
    useState(false);

  const [shipmentLoading, setShipmentLoading] =
    useState(false);

  const [statusUpdating, setStatusUpdating] =
    useState(false);

  const [riskLoading, setRiskLoading] =
    useState(false);

  const [error, setError] = useState("");

  const latestRisk = analyses[0];

  const selectedOrder = orders.find(
    (order) => order.id === selectedOrderId
  );

  const selectedShipment = shipments.find(
    (shipment) =>
      shipment.id === selectedShipmentId
  );

  const filteredOrders = orders.filter((order) => {
    const search = orderSearch.toLowerCase();

    return (
      order.id.toLowerCase().includes(search) ||
      order.customer?.name
        ?.toLowerCase()
        .includes(search) ||
      order.status.toLowerCase().includes(search)
    );
  });

  const filteredShipments = shipments.filter(
    (shipment) => {
      const search =
        shipmentSearch.toLowerCase();

      return (
        shipment.id
          .toLowerCase()
          .includes(search) ||
        shipment.trackingNumber
          ?.toLowerCase()
          .includes(search) ||
        shipment.orderId
          .toLowerCase()
          .includes(search) ||
        shipment.status
          .toLowerCase()
          .includes(search) ||
        shipment.order?.customer?.name
          ?.toLowerCase()
          .includes(search) ||
        shipment.supplier?.name
          ?.toLowerCase()
          .includes(search)
      );
    }
  );

  const getSeverityClass = (
    severity?: string
  ) => {
    if (severity === "CRITICAL") return "critical";
    if (severity === "HIGH") return "high";
    if (severity === "MEDIUM") return "medium";
    return "low";
  };

  const getShipmentStatusClass = (
    status: string
  ) => {
    switch (status) {
      case "DELIVERED":
        return "delivered";
      case "DELAYED":
        return "delayed";
      case "IN_TRANSIT":
        return "in-transit";
      case "CANCELLED":
        return "cancelled";
      default:
        return "pending";
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken("");
    setUser(null);
    setOrders([]);
    setShipments([]);
    setAnalyses([]);
    setSelectedOrderId("");
    setSelectedShipmentId("");
    setActivePage("dashboard");
  };

  const login = async () => {
    if (!email || !password) {
      setError(
        "Email and password are required"
      );
      return;
    }

    setLoginLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Login failed"
        );
      }

      const newToken = result.data.token;
      const newUser = result.data.user;

      localStorage.setItem("token", newToken);
      localStorage.setItem(
        "user",
        JSON.stringify(newUser)
      );

      setToken(newToken);
      setUser(newUser);
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed"
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!token) return;

    setDashboardLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error(
            "Session expired. Please login again."
          );
        }

        throw new Error(
          result.message ||
            "Failed to load orders"
        );
      }

      const fetchedOrders: Order[] =
        result.data?.orders ||
        result.data ||
        [];

      setOrders(fetchedOrders);

      if (
        fetchedOrders.length > 0 &&
        !selectedOrderId
      ) {
        setSelectedOrderId(
          fetchedOrders[0].id
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load orders"
      );
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchShipments = async () => {
    if (!token) return;

    setShipmentLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/shipments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error(
            "Session expired. Please login again."
          );
        }

        throw new Error(
          result.message ||
            "Failed to load shipments"
        );
      }

      const fetchedShipments: Shipment[] =
        result.data?.shipments ||
        result.data ||
        [];

      setShipments(fetchedShipments);

      if (
        fetchedShipments.length > 0 &&
        !selectedShipmentId
      ) {
        setSelectedShipmentId(
          fetchedShipments[0].id
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load shipments"
      );
    } finally {
      setShipmentLoading(false);
    }
  };

  const fetchRiskAnalysis = async (
    orderId: string
  ) => {
    if (!token || !orderId) return;

    setRiskLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/orders/${orderId}/risk`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error(
            "Session expired. Please login again."
          );
        }

        throw new Error(
          result.message ||
            "Failed to load risk analysis"
        );
      }

      setAnalyses(
        result.data?.analyses || []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load risk analysis"
      );

      setAnalyses([]);
    } finally {
      setRiskLoading(false);
    }
  };

  const updateShipmentStatus = async () => {
    if (
      !selectedShipment ||
      !shipmentStatus
    ) {
      return;
    }

    if (
      user?.role !== "ADMIN" &&
      user?.role !== "MANAGER"
    ) {
      setError(
        "Only ADMIN or MANAGER can update shipment status."
      );
      return;
    }

    setStatusUpdating(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/shipments/${selectedShipment.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: shipmentStatus,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to update shipment"
        );
      }

      await fetchShipments();
      await fetchOrders();

      setShipmentStatus("");

      /*
       * The worker processes the risk job
       * asynchronously. Give BullMQ a moment,
       * then refresh the risk analysis.
       */
      setTimeout(() => {
        fetchRiskAnalysis(
          selectedShipment.orderId
        );
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update shipment"
      );
    } finally {
      setStatusUpdating(false);
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchOrders();
      fetchShipments();
    }
  }, [token, user]);

  useEffect(() => {
    if (selectedOrderId) {
      fetchRiskAnalysis(selectedOrderId);
    }
  }, [selectedOrderId]);

  useEffect(() => {
    if (selectedShipment) {
      setShipmentStatus(
        selectedShipment.status
      );
    }
  }, [selectedShipmentId, shipments]);

  if (!token || !user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="brand">
            <div className="brand-icon">
              AI
            </div>

            <div>
              <h1>AI Supply Chain</h1>
              <p>
                Risk Intelligence Platform
              </p>
            </div>
          </div>

          <div className="login-heading">
            <h2>Welcome back</h2>

            <p>
              Sign in to access your supply
              chain dashboard.
            </p>
          </div>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  login();
                }
              }}
            />
          </div>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button
            className="primary-button login-button"
            onClick={login}
            disabled={loginLoading}
          >
            {loginLoading
              ? "Signing in..."
              : "Sign In"}
          </button>
        </div>
      </div>
    );
  }

  const renderDashboard = () => (
    <>
      <div className="page-heading">
        <div>
          <h2>
            Supply Chain Dashboard
          </h2>

          <p>
            Monitor orders and AI-powered
            supply chain risks.
          </p>
        </div>

        <div className="system-status">
          <span></span>
          System Online
        </div>
      </div>

      {error && (
        <div className="error dashboard-error">
          {error}
        </div>
      )}

      <section className="kpi-grid">
        <div className="kpi-card">
          <span>Total Orders</span>
          <strong>{orders.length}</strong>
          <small>Active orders</small>
        </div>

        <div className="kpi-card">
          <span>High Risk Orders</span>

          <strong>
            {latestRisk &&
            (latestRisk.severity === "HIGH" ||
              latestRisk.severity ===
                "CRITICAL")
              ? 1
              : 0}
          </strong>

          <small>
            Based on selected order
          </small>
        </div>

        <div className="kpi-card">
          <span>Selected Order</span>

          <strong>
            {selectedOrder
              ? selectedOrder.status
              : "-"}
          </strong>

          <small>Current status</small>
        </div>

        <div className="kpi-card">
          <span>AI Risk Score</span>

          <strong>
            {latestRisk
              ? latestRisk.riskScore
              : "-"}
          </strong>

          <small>
            {latestRisk
              ? latestRisk.severity
              : "No analysis"}
          </small>
        </div>
      </section>

      <section className="dashboard-card">
        <div className="section-heading">
          <div>
            <h3>Orders</h3>
            <p>
              Select an order to inspect its
              AI risk analysis.
            </p>
          </div>

          {dashboardLoading && (
            <span className="loading-text">
              Loading...
            </span>
          )}
        </div>

        {orders.length === 0 &&
        !dashboardLoading ? (
          <div className="empty-state">
            No orders found.
          </div>
        ) : (
          <div className="orders-table">
            <div className="order-row table-header">
              <span>Order</span>
              <span>Customer</span>
              <span>Status</span>
              <span>Total</span>
              <span>Promised</span>
            </div>

            {orders.map((order) => (
              <button
                className={`order-row ${
                  selectedOrderId === order.id
                    ? "selected"
                    : ""
                }`}
                key={order.id}
                onClick={() =>
                  setSelectedOrderId(
                    order.id
                  )
                }
              >
                <span className="order-id">
                  {order.id}
                </span>

                <span>
                  {order.customer?.name ||
                    "—"}
                </span>

                <span>
                  <span className="status-badge">
                    {order.status}
                  </span>
                </span>

                <span>
                  ₹
                  {order.totalAmount?.toLocaleString(
                    "en-IN"
                  )}
                </span>

                <span>
                  {new Date(
                    order.promisedDate
                  ).toLocaleDateString(
                    "en-IN"
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedOrder && (
        <section className="dashboard-card">
          <div className="section-heading">
            <div>
              <h3>AI Risk Analysis</h3>

              <p>
                Order {selectedOrder.id}
              </p>
            </div>

            {riskLoading && (
              <span className="loading-text">
                Loading analysis...
              </span>
            )}
          </div>

          {!riskLoading &&
          !latestRisk ? (
            <div className="empty-state">
              No risk analysis available for
              this order.
            </div>
          ) : (
            latestRisk && (
              <>
                <div className="risk-overview">
                  <div className="risk-score">
                    <span>
                      Current Risk Score
                    </span>

                    <strong>
                      {latestRisk.riskScore}
                      <small>/100</small>
                    </strong>

                    <div
                      className={`severity ${getSeverityClass(
                        latestRisk.severity
                      )}`}
                    >
                      {latestRisk.severity}
                    </div>
                  </div>

                  <div className="risk-event">
                    <span>
                      Latest Event
                    </span>

                    <strong>
                      {latestRisk.event}
                    </strong>

                    <small>
                      {new Date(
                        latestRisk.createdAt
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </small>
                  </div>
                </div>

                <div className="risk-columns">
                  <div>
                    <h4>Risk Factors</h4>

                    {latestRisk.factors.map(
                      (factor, index) => (
                        <div
                          className="risk-item"
                          key={index}
                        >
                          <span className="risk-icon">
                            !
                          </span>

                          <p>{factor}</p>
                        </div>
                      )
                    )}
                  </div>

                  <div>
                    <h4>
                      Recommended Actions
                    </h4>

                    {latestRisk.recommendations.map(
                      (
                        recommendation,
                        index
                      ) => (
                        <div
                          className="risk-item recommendation"
                          key={index}
                        >
                          <span className="action-icon">
                            →
                          </span>

                          <p>
                            {recommendation}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="risk-history">
                  <h4>Analysis History</h4>

                  {analyses.map(
                    (analysis) => (
                      <div
                        className="history-item"
                        key={analysis.id}
                      >
                        <span>
                          {new Date(
                            analysis.createdAt
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </span>

                        <span>
                          {analysis.event}
                        </span>

                        <strong>
                          {
                            analysis.riskScore
                          }
                        </strong>

                        <span
                          className={`severity small ${getSeverityClass(
                            analysis.severity
                          )}`}
                        >
                          {
                            analysis.severity
                          }
                        </span>
                      </div>
                    )
                  )}
                </div>
              </>
            )
          )}
        </section>
      )}
    </>
  );

  const renderOrders = () => (
    <>
      <div className="page-heading">
        <div>
          <h2>Orders</h2>

          <p>
            View and manage supply chain
            orders.
          </p>
        </div>

        <div className="system-status">
          <span></span>
          {orders.length} Orders
        </div>
      </div>

      {error && (
        <div className="error dashboard-error">
          {error}
        </div>
      )}

      <section className="dashboard-card">
        <div className="orders-toolbar">
          <div>
            <h3>All Orders</h3>

            <p>
              Search and select an order to
              inspect its details.
            </p>
          </div>

          <input
            className="order-search"
            value={orderSearch}
            onChange={(event) =>
              setOrderSearch(
                event.target.value
              )
            }
            placeholder="Search orders..."
          />
        </div>

        <div className="orders-table">
          <div className="order-row table-header">
            <span>Order</span>
            <span>Customer</span>
            <span>Status</span>
            <span>Total</span>
            <span>Promised</span>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              No matching orders found.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <button
                className={`order-row ${
                  selectedOrderId === order.id
                    ? "selected"
                    : ""
                }`}
                key={order.id}
                onClick={() => {
                  setSelectedOrderId(
                    order.id
                  );
                  setActivePage(
                    "dashboard"
                  );
                }}
              >
                <span className="order-id">
                  {order.id}
                </span>

                <span>
                  {order.customer?.name ||
                    "—"}
                </span>

                <span>
                  <span className="status-badge">
                    {order.status}
                  </span>
                </span>

                <span>
                  ₹
                  {order.totalAmount?.toLocaleString(
                    "en-IN"
                  )}
                </span>

                <span>
                  {new Date(
                    order.promisedDate
                  ).toLocaleDateString(
                    "en-IN"
                  )}
                </span>
              </button>
            ))
          )}
        </div>
      </section>
    </>
  );

  const renderShipments = () => (
    <>
      <div className="page-heading">
        <div>
          <h2>Shipments</h2>

          <p>
            Track shipment status and delivery
            performance.
          </p>
        </div>

        <div className="system-status">
          <span></span>
          {shipments.length} Shipments
        </div>
      </div>

      {error && (
        <div className="error dashboard-error">
          {error}
        </div>
      )}

      <section className="dashboard-card">
        <div className="orders-toolbar">
          <div>
            <h3>All Shipments</h3>

            <p>
              Select a shipment to inspect its
              current status.
            </p>
          </div>

          <input
            className="order-search"
            value={shipmentSearch}
            onChange={(event) =>
              setShipmentSearch(
                event.target.value
              )
            }
            placeholder="Search shipments..."
          />
        </div>

        {shipmentLoading ? (
          <div className="empty-state">
            Loading shipments...
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="empty-state">
            No shipments found.
          </div>
        ) : (
          <div className="shipments-table">
            <div className="shipment-row table-header">
              <span>Tracking</span>
              <span>Order</span>
              <span>Customer</span>
              <span>Status</span>
              <span>Expected</span>
            </div>

            {filteredShipments.map(
              (shipment) => (
                <button
                  className={`shipment-row ${
                    selectedShipmentId ===
                    shipment.id
                      ? "selected"
                      : ""
                  }`}
                  key={shipment.id}
                  onClick={() =>
                    setSelectedShipmentId(
                      shipment.id
                    )
                  }
                >
                  <span className="tracking">
                    {shipment.trackingNumber ||
                      "—"}
                  </span>

                  <span className="order-id">
                    {shipment.orderId}
                  </span>

                  <span>
                    {shipment.order
                      ?.customer?.name ||
                      "—"}
                  </span>

                  <span>
                    <span
                      className={`shipment-status ${getShipmentStatusClass(
                        shipment.status
                      )}`}
                    >
                      {shipment.status}
                    </span>
                  </span>

                  <span>
                    {new Date(
                      shipment.expectedDate
                    ).toLocaleDateString(
                      "en-IN"
                    )}
                  </span>
                </button>
              )
            )}
          </div>
        )}
      </section>

      {selectedShipment && (
        <section className="dashboard-card">
          <div className="section-heading">
            <div>
              <h3>
                Shipment Details
              </h3>

              <p>
                {
                  selectedShipment.trackingNumber
                }
              </p>
            </div>

            <span
              className={`shipment-status ${getShipmentStatusClass(
                selectedShipment.status
              )}`}
            >
              {selectedShipment.status}
            </span>
          </div>

          <div className="shipment-details-grid">
            <div className="detail-card">
              <span>Tracking Number</span>
              <strong>
                {selectedShipment.trackingNumber ||
                  "—"}
              </strong>
            </div>

            <div className="detail-card">
              <span>Order ID</span>
              <strong className="order-id">
                {selectedShipment.orderId}
              </strong>
            </div>

            <div className="detail-card">
              <span>Customer</span>
              <strong>
                {selectedShipment.order
                  ?.customer?.name ||
                  "—"}
              </strong>
            </div>

            <div className="detail-card">
              <span>Supplier</span>
              <strong>
                {selectedShipment.supplier
                  ?.name || "—"}
              </strong>
            </div>

            <div className="detail-card">
              <span>Expected Date</span>
              <strong>
                {new Date(
                  selectedShipment.expectedDate
                ).toLocaleDateString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div className="detail-card">
              <span>Actual Date</span>
              <strong>
                {selectedShipment.actualDate
                  ? new Date(
                      selectedShipment.actualDate
                    ).toLocaleDateString(
                      "en-IN"
                    )
                  : "Not delivered"}
              </strong>
            </div>
          </div>

          <div className="shipment-update">
            <div>
              <h4>
                Update Shipment Status
              </h4>

              <p>
                Updating the status triggers
                the AI risk-analysis worker.
              </p>
            </div>

            <div className="status-controls">
              <select
                value={shipmentStatus}
                onChange={(event) =>
                  setShipmentStatus(
                    event.target.value
                  )
                }
                disabled={
                  user.role !== "ADMIN" &&
                  user.role !== "MANAGER"
                }
              >
                {shipmentStatuses.map(
                  (status) => (
                    <option
                      value={status}
                      key={status}
                    >
                      {status}
                    </option>
                  )
                )}
              </select>

              <button
                className="primary-button"
                onClick={
                  updateShipmentStatus
                }
                disabled={
                  statusUpdating ||
                  (user.role !== "ADMIN" &&
                    user.role !== "MANAGER") ||
                  shipmentStatus ===
                    selectedShipment.status
                }
              >
                {statusUpdating
                  ? "Updating..."
                  : "Update Status"}
              </button>
            </div>

            {user.role !== "ADMIN" &&
              user.role !== "MANAGER" && (
                <small className="permission-note">
                  You are logged in as{" "}
                  {user.role}. Only ADMIN or
                  MANAGER users can change
                  shipment status.
                </small>
              )}
          </div>
        </section>
      )}
    </>
  );

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-icon small">
            AI
          </div>

          <div>
            <h1>AI Supply Chain</h1>

            <span>
              Risk Intelligence Platform
            </span>
          </div>
        </div>

        <div className="user-area">
          <div className="user-info">
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-layout">
        <aside className="sidebar">
          <button
            className={`nav-item ${
              activePage === "dashboard"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("dashboard")
            }
          >
            Dashboard
          </button>

          <button
            className={`nav-item ${
              activePage === "orders"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("orders")
            }
          >
            Orders
          </button>

          <button
            className={`nav-item ${
              activePage === "shipments"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("shipments")
            }
          >
            Shipments
          </button>

          <button
            className={`nav-item ${
              activePage === "inventory"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("inventory")
            }
          >
            Inventory
          </button>

          <button
            className={`nav-item ${
              activePage === "suppliers"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("suppliers")
            }
          >
            Suppliers
          </button>

          <button
            className={`nav-item ${
              activePage === "exceptions"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("exceptions")
            }
          >
            Exceptions
          </button>

          <button
            className={`nav-item ${
              activePage === "risk"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("risk")
            }
          >
            AI Risk Analysis
          </button>
        </aside>

        <main className="main-content">
          {activePage === "dashboard" &&
            renderDashboard()}

          {activePage === "orders" &&
            renderOrders()}

          {activePage === "shipments" &&
            renderShipments()}

          {activePage === "inventory" && token && (
  <InventoryPage token={token} />
)}

          {activePage === "suppliers" && token && (
  <SupplierPage token={token} />
)}

          {activePage === "exceptions" && token && (
  <ExceptionPage
    token={token}
    role={user?.role}
  />
)}

          {activePage === "risk" &&
            renderDashboard()}
        </main>
      </div>
    </div>
  );
}

export default App;
