"use client";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Activity,
  BarChart3,
  Download,
  DollarSign,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { toast } from "react-hot-toast";
import Loader from "@/components/Loader";

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function AnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [categoryData, setCategoryData] = useState([]); // expense categories
  const [incomeCategoryData, setIncomeCategoryData] = useState([]); // income categories
  const [monthlyComparisonData, setMonthlyComparisonData] = useState([]); // income vs expense by month
  const [anomalyData, setAnomalyData] = useState([]);
  const [predictedData, setPredictedData] = useState([]);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        // Call all 5 analytics endpoints in parallel
        const [
          anomalyRes,
          insightsRes,
          recommendationsRes,
          predictionsRes,
          incomeRes,
        ] = await Promise.allSettled([
          fetch(`${apiUrl}/analytics/anomalies/${user.uid}`),
          fetch(`${apiUrl}/analytics/insights/${user.uid}`),
          fetch(`${apiUrl}/analytics/recommendations/${user.uid}`),
          fetch(`${apiUrl}/analytics/predictions/${user.uid}`),
          fetch(`${apiUrl}/analytics/income-summary/${user.uid}`),
        ]);

        let realDataFound = false;

        // ── Process anomalies ────────────────────────────────────────────────
        if (anomalyRes.status === "fulfilled" && anomalyRes.value.ok) {
          const result = await anomalyRes.value.json();
          if (result.anomalies?.length > 0) {
            setAnomalyData(
              result.anomalies.map((a) => ({
                date: a.timestamp
                  ? a.timestamp.split("T")[0]
                  : a.date || "Unknown",
                amount: a.amount || 0,
                isAnomaly: true,
                reason: a.reason || a.methods?.join(", ") || "Unusual spending",
                severity: a.severity || "medium",
              })),
            );
            realDataFound = true;
          }
          setAnalyticsData((prev) => ({ ...prev, anomalies: result }));
        }

        // ── Process insights (expense patterns & categories) ──────────────────
        let expenseMonthlyMap = {}; // { "2025-01": total }
        if (insightsRes.status === "fulfilled" && insightsRes.value.ok) {
          const result = await insightsRes.value.json();

          if (result.category_analysis) {
            const catData = Object.entries(result.category_analysis)
              .map(([name, details]) => ({
                name,
                value: details.total_spent || details.total || 0,
              }))
              .filter((c) => c.value > 0);
            if (catData.length > 0) {
              setCategoryData(catData);
              realDataFound = true;
            }
          }

          // Build monthly expense map from spending_patterns
          if (result.spending_patterns?.by_day) {
            // by_day is day-of-week, not what we want for monthly chart
          }
          // Use total_spent + date_range to estimate — actual monthly from predictions later
          setAnalyticsData((prev) => ({ ...prev, insights: result }));
          if (result.recommendations) {
            setAnalyticsData((prev) => ({
              ...prev,
              insights_recommendations: result.recommendations,
            }));
          }
        }

        // ── Process recommendations ───────────────────────────────────────────
        if (
          recommendationsRes.status === "fulfilled" &&
          recommendationsRes.value.ok
        ) {
          const result = await recommendationsRes.value.json();
          setAnalyticsData((prev) => ({ ...prev, recommendations: result }));
          if (result.recommendations?.budget_suggestions?.length > 0)
            realDataFound = true;
        }

        // ── Process predictions ───────────────────────────────────────────────
        if (predictionsRes.status === "fulfilled" && predictionsRes.value.ok) {
          const result = await predictionsRes.value.json();
          setAnalyticsData((prev) => ({ ...prev, predictions: result }));

          if (
            result.predictions &&
            Object.keys(result.predictions).length > 0
          ) {
            const months = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ];
            const currentMonthIndex = new Date().getMonth();
            const totalPredicted = Object.values(result.predictions).reduce(
              (sum, cat) => sum + (cat.predicted || 0),
              0,
            );
            setPredictedData([
              {
                month: months[currentMonthIndex],
                actual: totalPredicted * 0.95,
                predicted: totalPredicted * 0.95,
              },
              ...Array.from({ length: 5 }, (_, i) => ({
                month: months[(currentMonthIndex + i + 1) % 12],
                actual: null,
                predicted: Math.round(totalPredicted * (1 + 0.03 * (i + 1))),
              })),
            ]);
            realDataFound = true;
          }
        }

        // ── Process income summary ────────────────────────────────────────────
        let incomeMonthlyMap = {}; // { "2025-01": total }
        if (incomeRes.status === "fulfilled" && incomeRes.value.ok) {
          const result = await incomeRes.value.json();
          setAnalyticsData((prev) => ({ ...prev, income: result }));

          if (result.category_breakdown?.length > 0) {
            setIncomeCategoryData(
              result.category_breakdown.map((c) => ({
                name: c.category,
                value: c.total,
              })),
            );
            realDataFound = true;
          }

          if (result.monthly_breakdown?.length > 0) {
            result.monthly_breakdown.forEach((m) => {
              incomeMonthlyMap[m.month] = m.total;
            });
            realDataFound = true;
          }
        }

        // ── Build monthly income vs expense comparison ────────────────────────
        // Use insights category_analysis to get per-month expense data
        // OR fall back to predictions historical data if available
        const insightsResult = analyticsData?.insights;
        // Build expense monthly map from anomaly timestamps + insights
        // Best approach: use spending_patterns from insights or predictions history
        const allMonths = new Set([...Object.keys(incomeMonthlyMap)]);

        // If predictions has historical data, use it
        const predictResult = analyticsData?.predictions;
        if (predictResult?.monthly_history) {
          Object.entries(predictResult.monthly_history).forEach(
            ([cat, months]) => {
              Object.entries(months).forEach(([month, amt]) => {
                expenseMonthlyMap[month] =
                  (expenseMonthlyMap[month] || 0) + amt;
                allMonths.add(month);
              });
            },
          );
        }

        if (allMonths.size > 0) {
          const comparison = Array.from(allMonths)
            .sort()
            .map((month) => {
              const [, m] = month.split("-");
              const monthNames = [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ];
              return {
                name: monthNames[parseInt(m) - 1] || month,
                income: Math.round(incomeMonthlyMap[month] || 0),
                expense: Math.round(expenseMonthlyMap[month] || 0),
              };
            });
          if (comparison.length > 0) setMonthlyComparisonData(comparison);
        }

        setHasData(realDataFound);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        toast.error("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyticsData();
  }, []);

  const generatePdfReport = async () => {
    setGeneratingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const { autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Analytics Report — Thikana Portal", 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

      doc.setFontSize(14);
      doc.text("Expense Categories", 14, 32);
      const catRows = categoryData.map((c) => [
        c.name,
        `₹${c.value?.toFixed(0)}`,
      ]);
      autoTable(doc, {
        startY: 37,
        head: [["Category", "Amount"]],
        body: catRows,
      });

      const afterCat = doc.lastAutoTable.finalY + 8;
      doc.setFontSize(14);
      doc.text("Income Categories", 14, afterCat);
      const incomeRows = incomeCategoryData.map((c) => [
        c.name,
        `₹${c.value?.toFixed(0)}`,
      ]);
      autoTable(doc, {
        startY: afterCat + 5,
        head: [["Category", "Amount"]],
        body: incomeRows,
      });

      doc.save("analytics-report.pdf");
      toast.success("Report downloaded!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report");
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    );

  const income = analyticsData?.income;
  const totalIncome = income?.total_income || 0;
  const monthlyAvgIncome = income?.monthly_average || 0;
  const insights = analyticsData?.insights;
  const totalExpense = insights?.total_spent || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground text-sm">
            Real-time business performance powered by AI
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!hasData && (
            <Badge
              variant="outline"
              className="px-3 py-1 text-amber-600 border-amber-300"
            >
              No data yet — add expenses & income first
            </Badge>
          )}
          <Button
            onClick={generatePdfReport}
            disabled={generatingPdf || !hasData}
            className="flex items-center gap-2"
          >
            {generatingPdf ? <Loader /> : <Download className="h-4 w-4" />}
            {generatingPdf ? "Generating..." : "Download Report"}
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      {hasData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Total Income</p>
              <p className="text-xl font-bold text-green-600">
                ₹
                {totalIncome.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Total Expenses</p>
              <p className="text-xl font-bold text-red-500">
                ₹
                {totalExpense.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Net Balance</p>
              <p
                className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? "text-green-600" : "text-red-500"}`}
              >
                ₹
                {(totalIncome - totalExpense).toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">
                Avg Monthly Income
              </p>
              <p className="text-xl font-bold text-indigo-600">
                ₹
                {monthlyAvgIncome.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income vs Expense Monthly Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Income vs Expenses
            </CardTitle>
            <CardDescription>Monthly comparison</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {monthlyComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(v) => [`₹${v?.toLocaleString("en-IN")}`, ""]}
                  />
                  <Legend />
                  <Bar
                    dataKey="income"
                    fill="#22c55e"
                    name="Income"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    fill="#ef4444"
                    name="Expense"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Income data will appear here once you add income entries" />
            )}
          </CardContent>
        </Card>

        {/* Expense by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-500" />
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [
                      `₹${v?.toLocaleString("en-IN")}`,
                      "Amount",
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Expense categories will appear here once you add expenses" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Income Category Chart */}
      {incomeCategoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Income by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeCategoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  width={90}
                />
                <Tooltip
                  formatter={(v) => [
                    `₹${v?.toLocaleString("en-IN")}`,
                    "Amount",
                  ]}
                />
                <Bar
                  dataKey="value"
                  fill="#22c55e"
                  name="Income"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Sub-tabs */}
      <Tabs defaultValue="anomalies">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger
            value="anomalies"
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            <AlertTriangle className="h-4 w-4" />
            Anomaly Detection
          </TabsTrigger>
          <TabsTrigger
            value="predictions"
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            <TrendingUp className="h-4 w-4" />
            Predictions
          </TabsTrigger>
          <TabsTrigger
            value="recommendations"
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            <Lightbulb className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        {/* Anomaly Detection */}
        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Anomaly Detection</CardTitle>
              <CardDescription>
                Unusual spending patterns flagged by AI — highlighted in red
              </CardDescription>
            </CardHeader>
            <CardContent>
              {anomalyData.length > 0 ? (
                <>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={anomalyData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="opacity-30"
                        />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(v) => [`₹${v}`, "Amount"]}
                          content={({ active, payload }) =>
                            active && payload?.length ? (
                              <div className="bg-white border rounded-lg p-2 shadow text-xs">
                                <p className="font-medium">
                                  {payload[0].payload.date}
                                </p>
                                <p className="text-red-500">
                                  ₹{payload[0].value}
                                </p>
                                <p className="text-gray-500">
                                  {payload[0].payload.reason}
                                </p>
                                <p className="capitalize text-orange-500">
                                  Severity: {payload[0].payload.severity}
                                </p>
                              </div>
                            ) : null
                          }
                        />
                        <Bar dataKey="amount">
                          {anomalyData.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={entry.isAnomaly ? "#ef4444" : "#6366f1"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 border rounded-xl p-4 bg-amber-50">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">
                          {analyticsData?.anomalies?.anomaly_count ||
                            anomalyData.length}{" "}
                          Anomaly Detected
                        </h4>
                        <p className="text-sm text-amber-700 mt-1">
                          Unusual transactions found in your spending history.
                          Review red bars above.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  {hasData ? (
                    <>
                      <Lightbulb className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p className="font-medium text-green-700">
                        No anomalies detected
                      </p>
                      <p className="text-sm mt-1">
                        Your spending patterns look consistent.
                      </p>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>Add expense transactions to detect anomalies.</p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions */}
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spending Predictions</CardTitle>
              <CardDescription>
                AI forecast based on your actual expense history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {predictedData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={predictedData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(v) =>
                          v
                            ? [`₹${Number(v).toLocaleString("en-IN")}`, ""]
                            : ["—", ""]
                        }
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#22c55e"
                        strokeWidth={2}
                        name="Actual"
                        dot={{ r: 4 }}
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="#6366f1"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Predicted"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart
                  message="Predictions require at least a few months of expense data."
                  height="h-64"
                />
              )}

              {analyticsData?.predictions?.predictions && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(analyticsData.predictions.predictions)
                    .slice(0, 6)
                    .map(([cat, data]) => (
                      <div
                        key={cat}
                        className="border rounded-lg p-3 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium text-sm">{cat}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {data.trend || "stable"} ·{" "}
                            {data.confidence || "low"} confidence
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-indigo-600">
                            ₹
                            {Math.round(data.predicted || 0).toLocaleString(
                              "en-IN",
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            predicted
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>
                Personalized savings suggestions based on your actual income (₹
                {monthlyAvgIncome.toLocaleString("en-IN")}/mo avg) and expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData?.recommendations?.recommendations
                ?.budget_suggestions?.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.recommendations.recommendations.budget_suggestions.map(
                    (s, i) => (
                      <div
                        key={i}
                        className="border rounded-xl p-4 bg-orange-50"
                      >
                        <div className="flex items-start gap-3">
                          <TrendingDown className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                          <div>
                            <h4 className="font-medium">{s.category}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Current: ₹{s.current_monthly?.toFixed(0)} →
                              Suggested: ₹{s.suggested_monthly?.toFixed(0)}{" "}
                              <span className="text-green-700 font-medium">
                                (Save ₹{s.potential_savings?.toFixed(0)}/mo)
                              </span>
                            </p>
                            {s.priority && (
                              <Badge
                                variant="outline"
                                className="mt-1 text-xs capitalize"
                              >
                                {s.priority} priority
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ),
                  )}

                  {analyticsData.recommendations.recommendations.category_tips
                    ?.length > 0 && (
                    <div className="mt-2 space-y-3">
                      <h4 className="font-semibold text-sm">Category Tips</h4>
                      {analyticsData.recommendations.recommendations.category_tips
                        .slice(0, 4)
                        .map((tip, i) => (
                          <div
                            key={i}
                            className="border rounded-xl p-3 bg-blue-50"
                          >
                            <div className="flex items-start gap-2">
                              <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                              <p className="text-sm text-gray-700">
                                {tip.tip || tip}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : hasData ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Lightbulb className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="font-medium text-green-700">
                    Spending looks healthy!
                  </p>
                  <p className="text-sm mt-1">
                    No specific budget adjustments needed right now.
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>
                    Add expenses and income to get personalized recommendations.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyChart({ message, height = "h-72" }) {
  return (
    <div
      className={`${height} flex items-center justify-center text-muted-foreground text-sm text-center px-4`}
    >
      <p>{message}</p>
    </div>
  );
}
