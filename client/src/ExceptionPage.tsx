import { useEffect, useMemo, useState } from "react";
import "./ExceptionPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type ExceptionType =
  | "INVENTORY_SHORTAGE"
  | "SHIPMENT_DELAY"
  | "SUPPLIER_DELAY"
  | "ORDER_AT_RISK";

type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface Exception {
  id: string;
  orderId?: string | null;
  createdById?: string | null;
  type: ExceptionType;
  severity: Severity;
  title: string;
  description: string;
  riskScore: number;
  resolved: boolean;
  createdAt: string;
  updatedAt?: string;

  order?: {
    id: string;
    status?: string;
    promisedDate?: string;
    customer?: {
      name?: string;
    };
    shipments?: Array<{
      id: string;
      trackingNumber?: string | null;
      status: string;
      expectedDate: string;
      actualDate?: string | null;
    }>;
  } | null;

  createdBy?: {
    id: string;
    name?: string;
    email?: string;
  } | null;
}

interface ExceptionPageProps {
  token: string;
  role?: string;
}

const typeLabels: Record<ExceptionType, string> = {
  INVENTORY_SHORTAGE: "Inventory Shortage",
  SHIPMENT_DELAY: "Shipment Delay",
  SUPPLIER_DELAY: "Supplier Risk",
  ORDER_AT_RISK: "Order At Risk",
};

const severityLabels: Record<Severity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getSeverityClass = (severity: Severity) => {
  switch (severity) {
    case "CRITICAL":
      return "severity-critical";
    case "HIGH":
      return "severity-high";
    case "MEDIUM":
      return "severity-medium";
    default:
      return "severity-low";
  }
};

const getTypeClass = (type: ExceptionType) => {
  switch (type) {
    case "INVENTORY_SHORTAGE":
      return "type-inventory";

    case "SHIPMENT_DELAY":
      return "type-shipment";

    case "SUPPLIER_DELAY":
      return "type-supplier";

    case "ORDER_AT_RISK":
      return "type-order";

    default:
      return "";
  }
};

export default function ExceptionPage({
  token,
  role,
}: ExceptionPageProps) {
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [selectedExceptionId, setSelectedExceptionId] =
    useState<string>("");

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] =
    useState<"ALL" | Severity>("ALL");
  const [statusFilter, setStatusFilter] =
    useState<"ALL" | "OPEN" | "RESOLVED">("OPEN");

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [resolving, setResolving] = useState(false);

  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const canManage =
    role === "ADMIN" ||
    role === "MANAGER";

  const selectedException = exceptions.find(
    (exception) =>
      exception.id === selectedExceptionId
  );

  /*
   * =====================================================
   * FETCH ALL EXCEPTIONS
   * =====================================================
   */

  const fetchExceptions = async (
    keepSelection = false
  ) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/exceptions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to fetch exceptions"
        );
      }

      const fetchedExceptions: Exception[] =
        result.data?.exceptions || [];

      setExceptions(fetchedExceptions);

      if (!keepSelection) {
        if (fetchedExceptions.length > 0) {
          setSelectedExceptionId(
            fetchedExceptions[0].id
          );
        } else {
          setSelectedExceptionId("");
        }
      } else {
        const stillExists =
          fetchedExceptions.some(
            (exception) =>
              exception.id === selectedExceptionId
          );

        if (!stillExists) {
          setSelectedExceptionId(
            fetchedExceptions.length > 0
              ? fetchedExceptions[0].id
              : ""
          );
        }
      }
    } catch (err: any) {
      setError(
        err.message || "Failed to fetch exceptions"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =====================================================
   * FETCH SINGLE EXCEPTION
   * =====================================================
   */

  const fetchExceptionById = async (id: string) => {
    try {
      setDetailLoading(true);

      const response = await fetch(
        `${API_URL}/exceptions/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to fetch exception details"
        );
      }

      const detailedException =
        result.data?.exception;

      if (!detailedException) {
        return;
      }

      setExceptions((current) =>
        current.map((exception) =>
          exception.id === id
            ? detailedException
            : exception
        )
      );
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to fetch exception details"
      );
    } finally {
      setDetailLoading(false);
    }
  };

  /*
   * =====================================================
   * RUN DETECTION
   * =====================================================
   */

  const runDetection = async () => {
    try {
      setDetecting(true);
      setError("");
      setActionMessage("");

      const response = await fetch(
        `${API_URL}/exceptions/detect`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Exception detection failed"
        );
      }

      const total =
        result.data?.total ?? 0;

      setActionMessage(
        `Detection completed. ${total} new exception${
          total === 1 ? "" : "s"
        } detected.`
      );

      await fetchExceptions(false);
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to run exception detection"
      );
    } finally {
      setDetecting(false);
    }
  };

  /*
   * =====================================================
   * RESOLVE EXCEPTION
   * =====================================================
   */

  const resolveException = async () => {
    if (!selectedException) return;

    try {
      setResolving(true);
      setError("");
      setActionMessage("");

      const response = await fetch(
        `${API_URL}/exceptions/${selectedException.id}/resolve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to resolve exception"
        );
      }

      setActionMessage(
        "Exception resolved successfully."
      );

      await fetchExceptions(true);
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to resolve exception"
      );
    } finally {
      setResolving(false);
    }
  };

  /*
   * =====================================================
   * INITIAL LOAD
   * =====================================================
   */

  useEffect(() => {
    if (!token) return;

    fetchExceptions(false);
  }, [token]);

  /*
   * =====================================================
   * LOAD DETAILS WHEN SELECTION CHANGES
   * =====================================================
   */

  useEffect(() => {
    if (!selectedExceptionId || !token) return;

    fetchExceptionById(selectedExceptionId);
  }, [selectedExceptionId]);

  /*
   * =====================================================
   * FILTERING
   * =====================================================
   */

  const filteredExceptions = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return exceptions.filter((exception) => {
      const matchesSearch =
        !searchText ||
        exception.title
          .toLowerCase()
          .includes(searchText) ||
        exception.description
          .toLowerCase()
          .includes(searchText) ||
        exception.type
          .toLowerCase()
          .includes(searchText) ||
        exception.orderId
          ?.toLowerCase()
          .includes(searchText);

      const matchesSeverity =
        severityFilter === "ALL" ||
        exception.severity === severityFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "OPEN" &&
          !exception.resolved) ||
        (statusFilter === "RESOLVED" &&
          exception.resolved);

      return (
        matchesSearch &&
        matchesSeverity &&
        matchesStatus
      );
    });
  }, [
    exceptions,
    search,
    severityFilter,
    statusFilter,
  ]);

  /*
   * =====================================================
   * SUMMARY
   * =====================================================
   */

  const openExceptions = exceptions.filter(
    (exception) => !exception.resolved
  );

  const highRiskExceptions =
    exceptions.filter(
      (exception) =>
        !exception.resolved &&
        (exception.severity === "HIGH" ||
          exception.severity === "CRITICAL")
    );

  const criticalExceptions =
    exceptions.filter(
      (exception) =>
        !exception.resolved &&
        exception.severity === "CRITICAL"
    );

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <div className="exception-page">

      {/* HEADER */}

      <div className="exception-page-header">
        <div>
          <h1>Exceptions</h1>

          <p>
            Detect, review and resolve supply chain
            exceptions.
          </p>
        </div>

        <div className="exception-header-actions">
          <span className="records-indicator">
            <span className="online-dot" />
            {openExceptions.length} Open
          </span>

          {canManage && (
            <button
              className="detect-button"
              onClick={runDetection}
              disabled={detecting}
            >
              {detecting
                ? "Running Detection..."
                : "Run Detection"}
            </button>
          )}
        </div>
      </div>

      {/* MESSAGES */}

      {error && (
        <div className="exception-error">
          {error}
        </div>
      )}

      {actionMessage && (
        <div className="exception-success">
          {actionMessage}
        </div>
      )}

      {/* KPI CARDS */}

      <div className="exception-kpi-grid">

        <div className="exception-kpi-card">
          <span>Open Exceptions</span>

          <strong>
            {openExceptions.length}
          </strong>

          <small>
            Require attention
          </small>
        </div>

        <div className="exception-kpi-card">
          <span>High Risk</span>

          <strong>
            {highRiskExceptions.length}
          </strong>

          <small>
            High or critical severity
          </small>
        </div>

        <div className="exception-kpi-card">
          <span>Critical</span>

          <strong>
            {criticalExceptions.length}
          </strong>

          <small>
            Immediate attention
          </small>
        </div>

        <div className="exception-kpi-card">
          <span>Resolved</span>

          <strong>
            {
              exceptions.filter(
                (exception) =>
                  exception.resolved
              ).length
            }
          </strong>

          <small>
            Successfully resolved
          </small>
        </div>

      </div>

      {/* MAIN CONTENT */}

      <div className="exception-main-grid">

        {/* LIST */}

        <section className="exception-list-card">

          <div className="exception-list-header">

            <div>
              <h2>All Exceptions</h2>

              <p>
                Select an exception to inspect
                its details and risk.
              </p>
            </div>

            <input
              type="text"
              placeholder="Search exceptions..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              className="exception-search"
            />

          </div>

          <div className="exception-filters">

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "ALL"
                    | "OPEN"
                    | "RESOLVED"
                )
              }
            >
              <option value="OPEN">
                Open
              </option>

              <option value="ALL">
                All Status
              </option>

              <option value="RESOLVED">
                Resolved
              </option>
            </select>

            <select
              value={severityFilter}
              onChange={(event) =>
                setSeverityFilter(
                  event.target.value as
                    | "ALL"
                    | Severity
                )
              }
            >
              <option value="ALL">
                All Severity
              </option>

              <option value="CRITICAL">
                Critical
              </option>

              <option value="HIGH">
                High
              </option>

              <option value="MEDIUM">
                Medium
              </option>

              <option value="LOW">
                Low
              </option>
            </select>

          </div>

          {loading ? (
            <div className="exception-empty">
              Loading exceptions...
            </div>
          ) : filteredExceptions.length === 0 ? (
            <div className="exception-empty">
              <div className="empty-icon">
                ✓
              </div>

              <strong>
                No exceptions found
              </strong>

              <span>
                There are no exceptions matching
                the current filters.
              </span>
            </div>
          ) : (
            <div className="exception-table-wrapper">

              <table className="exception-table">

                <thead>
                  <tr>
                    <th>EXCEPTION</th>
                    <th>TYPE</th>
                    <th>SEVERITY</th>
                    <th>RISK</th>
                    <th>STATUS</th>
                    <th>CREATED</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredExceptions.map(
                    (exception) => (
                      <tr
                        key={exception.id}
                        className={
                          selectedExceptionId ===
                          exception.id
                            ? "selected-exception-row"
                            : ""
                        }
                        onClick={() =>
                          setSelectedExceptionId(
                            exception.id
                          )
                        }
                      >

                        <td>
                          <div className="exception-title-cell">
                            <strong>
                              {exception.title}
                            </strong>

                            <small>
                              {exception.id}
                            </small>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`type-badge ${getTypeClass(
                              exception.type
                            )}`}
                          >
                            {
                              typeLabels[
                                exception.type
                              ]
                            }
                          </span>
                        </td>

                        <td>
                          <span
                            className={`severity-badge ${getSeverityClass(
                              exception.severity
                            )}`}
                          >
                            {
                              severityLabels[
                                exception.severity
                              ]
                            }
                          </span>
                        </td>

                        <td>
                          <strong>
                            {exception.riskScore}
                          </strong>
                          <span className="risk-out-of">
                            /100
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              exception.resolved
                                ? "status-resolved"
                                : "status-open"
                            }
                          >
                            {exception.resolved
                              ? "RESOLVED"
                              : "OPEN"}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            exception.createdAt
                          )}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* DETAILS */}

        {selectedException && (
          <section className="exception-detail-card">

            <div className="exception-detail-header">

              <div>
                <span className="detail-label">
                  Exception Details
                </span>

                <h2>
                  {selectedException.title}
                </h2>

                <span className="detail-id">
                  {selectedException.id}
                </span>
              </div>

              <div className="detail-badges">

                <span
                  className={`severity-badge ${getSeverityClass(
                    selectedException.severity
                  )}`}
                >
                  {
                    severityLabels[
                      selectedException.severity
                    ]
                  }
                </span>

                <span
                  className={
                    selectedException.resolved
                      ? "status-resolved"
                      : "status-open"
                  }
                >
                  {selectedException.resolved
                    ? "RESOLVED"
                    : "OPEN"}
                </span>

              </div>

            </div>

            {detailLoading && (
              <div className="detail-loading">
                Loading latest details...
              </div>
            )}

            {/* RISK SCORE */}

            <div className="risk-score-panel">

              <div>
                <span>
                  Current Risk Score
                </span>

                <div className="risk-score-value">
                  {selectedException.riskScore}
                  <small>/100</small>
                </div>

                <span
                  className={`severity-badge ${getSeverityClass(
                    selectedException.severity
                  )}`}
                >
                  {
                    severityLabels[
                      selectedException.severity
                    ]
                  }
                </span>
              </div>

              <div className="risk-score-bar-container">

                <div className="risk-score-bar">

                  <div
                    className={`risk-score-fill ${getSeverityClass(
                      selectedException.severity
                    )}`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          selectedException.riskScore
                        )
                      )}%`,
                    }}
                  />

                </div>

                <div className="risk-score-labels">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>

              </div>

            </div>

            {/* DETAILS GRID */}

            <div className="exception-info-grid">

              <div className="exception-info-box">
                <span>Type</span>

                <strong>
                  {
                    typeLabels[
                      selectedException.type
                    ]
                  }
                </strong>
              </div>

              <div className="exception-info-box">
                <span>Risk Score</span>

                <strong>
                  {selectedException.riskScore}/100
                </strong>
              </div>

              <div className="exception-info-box">
                <span>Created</span>

                <strong>
                  {formatDateTime(
                    selectedException.createdAt
                  )}
                </strong>
              </div>

              <div className="exception-info-box">
                <span>Status</span>

                <strong>
                  {selectedException.resolved
                    ? "Resolved"
                    : "Open"}
                </strong>
              </div>

            </div>

            {/* DESCRIPTION */}

            <div className="exception-description">

              <h3>Risk Description</h3>

              <p>
                {selectedException.description}
              </p>

            </div>

            {/* ORDER INFORMATION */}

            {selectedException.order && (
              <div className="exception-related">

                <h3>
                  Related Order
                </h3>

                <div className="related-grid">

                  <div>
                    <span>Order ID</span>

                    <strong>
                      {
                        selectedException
                          .order.id
                      }
                    </strong>
                  </div>

                  {selectedException.order
                    .customer?.name && (
                    <div>
                      <span>Customer</span>

                      <strong>
                        {
                          selectedException
                            .order.customer.name
                        }
                      </strong>
                    </div>
                  )}

                  {selectedException.order
                    .status && (
                    <div>
                      <span>Status</span>

                      <strong>
                        {
                          selectedException
                            .order.status
                        }
                      </strong>
                    </div>
                  )}

                  {selectedException.order
                    .promisedDate && (
                    <div>
                      <span>
                        Promised Date
                      </span>

                      <strong>
                        {formatDate(
                          selectedException
                            .order.promisedDate
                        )}
                      </strong>
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* SHIPMENTS */}

            {selectedException.order
              ?.shipments &&
              selectedException.order.shipments
                .length > 0 && (
                <div className="exception-related">

                  <h3>
                    Related Shipments
                  </h3>

                  <div className="related-shipments">

                    {selectedException.order.shipments.map(
                      (shipment) => (
                        <div
                          key={shipment.id}
                          className="related-shipment"
                        >

                          <div>
                            <span>
                              Tracking Number
                            </span>

                            <strong>
                              {
                                shipment.trackingNumber ||
                                shipment.id
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Status
                            </span>

                            <strong>
                              {
                                shipment.status
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Expected
                            </span>

                            <strong>
                              {formatDate(
                                shipment.expectedDate
                              )}
                            </strong>
                          </div>

                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

            {/* ACTIONS */}

            {!selectedException.resolved &&
              canManage && (
                <div className="exception-actions">

                  <button
                    className="resolve-button"
                    onClick={
                      resolveException
                    }
                    disabled={resolving}
                  >
                    {resolving
                      ? "Resolving..."
                      : "Mark as Resolved"}
                  </button>

                </div>
              )}

            {selectedException.resolved && (
              <div className="resolved-message">
                <span>✓</span>

                <div>
                  <strong>
                    Exception resolved
                  </strong>

                  <p>
                    This exception no longer
                    requires active attention.
                  </p>
                </div>
              </div>
            )}

          </section>
        )}

      </div>

    </div>
  );
}