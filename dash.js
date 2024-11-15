let salesTrendChart = null; // Keep a reference to the sales trend chart

// Fetch and display dashboard metrics
async function fetchDashboardData() {
  try {
    const response = await fetch('http://localhost:3000/api/dashboard');
    const data = await response.json();
    document.getElementById('total-items').textContent = data.totalItems || 0;
    document.getElementById('sales-7-days').textContent = data.sales7Days || 0;
    document.getElementById('sales-30-days').textContent = data.sales30Days || 0;
    document.getElementById('products-in-stock').textContent = data.productsInStock || 0;
    renderSalesTrendChart(data.salesTrend);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  }
}

// Render sales trend chart
function renderSalesTrendChart(salesData = { dates: [], values: [] }) {
  const ctx = document.getElementById('salesTrendChart').getContext('2d');

  // Destroy existing chart instance if it exists
  if (salesTrendChart) {
    salesTrendChart.destroy();
  }

  // Create a new chart instance
  salesTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: salesData.dates,
      datasets: [{
        label: 'Sales Amount',
        data: salesData.values,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
      }],
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'Date' } },
        y: { title: { display: true, text: 'Sales Amount' } }
      }
    }
  });
}

// Load sold items
async function loadSoldItems() {
  try {
    const tableBody = document.getElementById("soldItemsTableBody");
    if (!tableBody) {
      console.error("Element with id 'soldItemsTableBody' not found in the DOM.");
      return; // Stop execution if element is not found
    }
    
    const response = await fetch('http://localhost:3000/api/sold-items');
    const soldItems = await response.json();
    tableBody.innerHTML = "";
    soldItems.forEach(soldItem => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${soldItem._id}</td>
        <td>${soldItem.serialNumber}</td>
        <td>${soldItem.name}</td>
        <td>${soldItem.category}</td>
        <td>${soldItem.quantity}</td>
        <td>${new Date(soldItem.dateSold).toLocaleDateString()}</td>
        <td>${soldItem.soldPrice}</td>
        <td>${soldItem.discountApplied || soldItem.discountApplied}</td>
        <td>${soldItem.isDiscounted ? "Discounted" : "Original Price"}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading sold items:", error);
  }
}

async function fetchSalesTrend() {
  try {
    const response = await fetch('http://localhost:3000/api/sales-trends?period=30');
    if (!response.ok) throw new Error("Failed to fetch sales trend data.");
    const data = await response.json();
    
    if (data.salesTrend && Array.isArray(data.salesTrend.dates) && Array.isArray(data.salesTrend.values)) {
      // Aggregating the sales data by date
      const salesData = aggregateSalesTrendData(data.salesTrend);
      renderSalesTrendChart(salesData);
    } else {
      console.error("Unexpected sales trend data format:", data);
    }
  } catch (error) {
    console.error("Error fetching sales trend data:", error);
  }
}

async function fetchTopProducts() {
  try {
    const response = await fetch('http://localhost:3000/api/top-products');
    if (!response.ok) throw new Error("Failed to fetch top products data.");
    const data = await response.json();
    
    if (data.products && Array.isArray(data.products)) {
      // Aggregating products by category and calculating their total sales
      const aggregatedProducts = aggregateTopProductsByCategory(data.products);
      renderProductAnalysisChart(aggregatedProducts);
    } else {
      console.error("Unexpected top products data format:", data);
    }
  } catch (error) {
    console.error("Error fetching top products data:", error);
  }
}

function aggregateSalesTrendData(salesTrend) {
  // Aggregate sales trend data by date
  const dates = salesTrend.dates;
  const values = salesTrend.values;
  
  const aggregatedSales = dates.reduce((acc, date, index) => {
    const currentDate = new Date(date).toLocaleDateString(); // Format date as string
    if (!acc[currentDate]) {
      acc[currentDate] = 0;
    }
    acc[currentDate] += values[index];
    return acc;
  }, {});

  // Convert aggregated sales into arrays for chart rendering
  const aggregatedDates = Object.keys(aggregatedSales);
  const aggregatedValues = Object.values(aggregatedSales);

  return { dates: aggregatedDates, values: aggregatedValues };
}

function aggregateTopProductsByCategory(products) {
  // Aggregate products by category and calculate total sales
  const aggregatedProducts = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = { name: product.category, sales: 0 };
    }
    acc[product.category].sales += product.sales;
    return acc;
  }, {});

  // Convert the aggregated products into an array for chart rendering
  return Object.values(aggregatedProducts);
}

function renderSalesTrendChart(salesData = { dates: [], values: [] }) {
  const ctx = document.getElementById('salesTrendChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: salesData.dates,
      datasets: [{
        label: 'Sales Amount',
        data: salesData.values,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
      }],
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'Date' } },
        y: { title: { display: true, text: 'Sales Amount' } }
      }
    }
  });
}

function renderProductAnalysisChart(products = []) {
  const ctx = document.getElementById('productAnalysisChart').getContext('2d');
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: products.map(product => product.name),
      datasets: [{
        data: products.map(product => product.sales),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' }
      }
    }
  });
}

// Load items from the inventory
async function loadItems() {
  try {
    const response = await fetch('http://localhost:3000/api/get-items');
    const items = await response.json();
    const tableBody = document.getElementById("itemsTableBody");
    tableBody.innerHTML = "";
    items.forEach(item => {
      const row = document.createElement("tr");
      const isNew = new Date(item.purchaseDate) >= new Date(new Date().setDate(new Date().getDate() - 30));
      const status = isNew ? 'New' : 'Old';
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.quantity || 0}</td>
        <td>${status}</td>
        <td><button onclick="sellItem('${item._id}')">Sell</button></td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading items:", error);
  }
}

// Handle selling an item with a styled form
async function sellItem(itemId) {
  const formHtml = `
    <style>
      #sellForm {
        display: flex;
        flex-direction: column;
        gap: 12px;
        font-family: Arial, sans-serif;
      }
      #sellForm label {
        font-weight: bold;
        color: #444;
        margin-bottom: 4px;
      }
      #sellForm input {
        padding: 8px;
        font-size: 1em;
        border: 1px solid #ddd;
        border-radius: 4px;
        width: 100%;
        box-sizing: border-box;
      }
      #sellForm input:focus {
        border-color: #4CAF50;
        outline: none;
      }
      #sellForm input[type="number"]::-webkit-outer-spin-button,
      #sellForm input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      #sellForm input[type="number"] {
        -moz-appearance: textfield;
      }
    </style>
    <form id="sellForm">
      <label for="quantity">Quantity to Sell</label>
      <input type="number" id="quantity" placeholder="Enter quantity" required />
      
      <label for="soldPrice">Selling Price</label>
      <input type="number" id="soldPrice" placeholder="Enter price" required />
      
      <label for="discount">Discount</label>
      <input type="number" id="discount" placeholder="Optional discount" />
    </form>
  `;

  const sellData = await Swal.fire({
    title: 'Enter Sale Details',
    html: formHtml,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Sell',
    preConfirm: () => {
      const quantity = document.getElementById('quantity').value;
      const soldPrice = document.getElementById('soldPrice').value;
      const discount = document.getElementById('discount').value;
      if (!quantity || quantity <= 0 || !soldPrice || soldPrice <= 0) {
        Swal.showValidationMessage('Please enter valid quantity and price');
        return false;
      }
      return { quantity, soldPrice, discount: discount || 0 };
    }
  });

  if (sellData.isConfirmed) {
    const { quantity, soldPrice, discount } = sellData.value;

    try {
      const response = await fetch('http://localhost:3000/api/sell-item', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity, soldPrice, discount }),
      });

      const result = await response.json();
      if (response.ok) {
        Swal.fire('Success!', result.message, 'success');
        loadItems();
        loadSoldItems();
      } else {
        Swal.fire('Error', result.error || "Failed to sell item.", 'error');
      }
    } catch (error) {
      console.error("Error selling item:", error);
      Swal.fire('Error', "Failed to sell item.", 'error');
    }
  }
}

// Export table data to Excel
function exportToExcel(tableSelector, fileName) {
  const table = document.querySelector(tableSelector);
  const worksheet = XLSX.utils.table_to_sheet(table);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, fileName);
}

// Function to search items
async function searchItems() {
  const query = document.getElementById("searchInput").value;

  if (!query) {
    alert("Please enter a search term.");
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/search-items?query=${encodeURIComponent(query)}`);
    const results = await response.json();

    displaySearchResults(results);
  } catch (error) {
    console.error("Error searching items:", error);
  }
}

/// Function to search items
async function searchItems() {
  const query = document.getElementById("searchInput").value;

  if (!query) {
    alert("Please enter a search term.");
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/search-items?query=${encodeURIComponent(query)}`);
    const results = await response.json();

    displaySearchResults(results);
  } catch (error) {
    console.error("Error searching items:", error);
  }
}

// Function to display search results
function displaySearchResults(items) {
  const tableBody = document.getElementById("searchResultsBody");
  tableBody.innerHTML = ""; // Clear previous results

  items.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.serialNumber}</td>
      <td>${item.quantity}</td>
      <td>${item.sellingPrice}</td>
    `;
    tableBody.appendChild(row);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;

  // Load the saved theme preference
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.checked = true;
  }

  // Listen for theme toggle changes
  themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
      body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark'); // Save preference
    } else {
      body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light'); // Save preference
    }
  });
});




document.addEventListener("DOMContentLoaded", () => {
document.getElementById('export-sold-btn').addEventListener('click', () => exportToExcel('#soldItemsTableBody', 'Sold_items.xlsx'));
    document.getElementById('export-items-btn').addEventListener('click', () => exportToExcel('#itemsTableBody', 'inventory_items.xlsx'));
  });
// Initialize data fetching on page load
window.onload = () => {
  fetchDashboardData();
  fetchSalesTrend();
  fetchTopProducts();
  loadItems();
  loadSoldItems();
  
};


