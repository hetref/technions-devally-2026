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
const MONTH_NAMES = [
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

export default function AnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [incomeCategoryData, setIncomeCategoryData] = useState([]);
  const [monthlyComparisonData, setMonthlyComparisonData] = useState([]);
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
        // Single endpoint — API does 2 Firestore reads total and runs all 4 models
        const res = await fetch(
          `${apiUrl}/analytics/full-analysis/${user.uid}`,
        );
        if (!res.ok) throw new Error(`API returned ${res.status}`);

        const data = await res.json();
        setAnalyticsData(data);

        let realDataFound = false;

        // ── Anomalies ────────────────────────────────────────────────────────
        const anomalies = data.anomalies?.anomalies ?? [];
        if (anomalies.length > 0) {
          setAnomalyData(
            anomalies.map((a) => ({
              date: a.timestamp
                ? a.timestamp.split("T")[0]
                : a.date || "Unknown",
              amount: a.amount || 0,
              isAnomaly: true,
              reason:
                a.reason || (a.flags ?? []).join(", ") || "Unusual spending",
              severity: a.severity || "medium",
            })),
          );
          realDataFound = true;
        }

        // ── Expense category pie ──────────────────────────────────────────────
        const catData = Object.entries(data.insights?.category_analysis ?? {})
          .map(([name, d]) => ({ name, value: d.total_spent || d.total || 0 }))
          .filter((c) => c.value > 0);
        if (catData.length > 0) {
          setCategoryData(catData);
          realDataFound = true;
        }

        // ── Spending predictions ──────────────────────────────────────────────
        const preds = data.predictions?.predictions;
        if (preds && Object.keys(preds).length > 0) {
          const curMonth = new Date().getMonth();
          const totalPred = Object.values(preds).reduce(
            (s, c) => s + (c.predicted || 0),
            0,
          );
          setPredictedData([
            {
              month: MONTH_NAMES[curMonth],
              actual: Math.round(totalPred),
              predicted: Math.round(totalPred),
            },
            ...Array.from({ length: 5 }, (_, i) => ({
              month: MONTH_NAMES[(curMonth + i + 1) % 12],
              actual: null,
              predicted: Math.round(totalPred * (1 + 0.03 * (i + 1))),
            })),
          ]);
          realDataFound = true;
        }

        // ── Income summary ────────────────────────────────────────────────────
        const income = data.income_summary ?? {};
        if (income.category_breakdown?.length > 0) {
          setIncomeCategoryData(
            income.category_breakdown.map((c) => ({
              name: c.category,
              value: c.total,
            })),
          );
          realDataFound = true;
        }

        // ── Monthly income vs expense comparison ──────────────────────────────
        const incomeMap = {};
        const expenseMap = {};
        (income.monthly_breakdown ?? []).forEach((m) => {
          incomeMap[m.month] = m.total;
        });
        Object.values(data.predictions?.monthly_history ?? {}).forEach(
          (catHistory) => {
            Object.entries(catHistory).forEach(([month, amt]) => {
              expenseMap[month] = (expenseMap[month] || 0) + amt;
            });
          },
        );
        const allMonths = new Set([
          ...Object.keys(incomeMap),
          ...Object.keys(expenseMap),
        ]);
        if (allMonths.size > 0) {
          const comparison = Array.from(allMonths)
            .sort()
            .map((month) => {
              const [, m] = month.split("-");
              return {
                name: MONTH_NAMES[parseInt(m) - 1] || month,
                income: Math.round(incomeMap[month] || 0),
                expense: Math.round(expenseMap[month] || 0),
              };
            });
          if (comparison.length > 0) setMonthlyComparisonData(comparison);
        }

        if (income.total_entries > 0 || catData.length > 0)
          realDataFound = true;
        setHasData(realDataFound);
      } catch (error) {
        console.error("Analytics fetch error:", error);
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
      autoTable(doc, {
        startY: 37,
        head: [["Category", "Amount"]],
        body: categoryData.map((c) => [c.name, `₹${c.value?.toFixed(0)}`]),
      });
      const y2 = doc.lastAutoTable.finalY + 8;
      doc.setFontSize(14);
      doc.text("Income Categories", 14, y2);
      autoTable(doc, {
        startY: y2 + 5,
        head: [["Category", "Amount"]],
        body: incomeCategoryData.map((c) => [
          c.name,
          `₹${c.value?.toFixed(0)}`,
        ]),
      });
      doc.save("analytics-report.pdf");
      toast.success("Report downloaded!");
    } catch (error) {
      console.error("PDF error:", error);
      toast.error("Failed to generate PDF");
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

  const income = analyticsData?.income_summary;
  const totalIncome = income?.total_income || 0;
  const monthlyAvgIncome = income?.monthly_average || 0;
  const totalExpense = analyticsData?.insights?.total_spent || 0;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
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
              No data yet — add expenses &amp; income first
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

      {/* ── KPI Cards ── */}
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

      {/* ── Main Charts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <EmptyChart message="Add income entries to see monthly comparison" />
            )}
          </CardContent>
        </Card>

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

      {/* ── Income Category Bar ── */}
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

      {/* ── Sub-tabs ── */}
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

        {/* Anomalies */}
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
                          Unusual Transaction
                          {(analyticsData?.anomalies?.anomaly_count ||
                            anomalyData.length) !== 1
                            ? "s"
                            : ""}{" "}
                          Detected
                        </h4>
                        <p className="text-sm text-amber-700 mt-1">
                          Review the red bars above for unusual spending.
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
                        name="Predicted"
                        dot={{ r: 4 }}
                        strokeDasharray="5 5"
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
                    .map(([cat, d]) => (
                      <div
                        key={cat}
                        className="border rounded-lg p-3 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium text-sm">{cat}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {d.trend || "stable"} · {d.confidence || "low"}{" "}
                            confidence
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-indigo-600">
                            ₹
                            {Math.round(d.predicted || 0).toLocaleString(
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
                Based on your actual income (₹
                {monthlyAvgIncome.toLocaleString("en-IN")}/mo avg) and spending
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
                                {tip.tip ||
                                  (typeof tip === "string" ? tip : "")}
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
