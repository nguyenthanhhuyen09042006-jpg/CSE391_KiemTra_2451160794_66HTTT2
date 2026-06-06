// Biến toàn cục
let borrows = JSON.parse(localStorage.getItem('borrows')) || [];
let editMode = false;

// DOM Elements
const modal = document.getElementById("formModal");
const btnOpenModal = document.getElementById("btnOpenModal");
const spanClose = document.getElementsByClassName("close")[0];
const form = document.getElementById("borrowForm");

// Mở/Đóng Modal
btnOpenModal.onclick = () => {
    editMode = false;
    form.reset();
    document.getElementById("borrowId").disabled = false;
    document.getElementById("modalTitle").innerText = "Thêm phiếu mượn";
    clearErrors();
    modal.style.display = "block";
}
spanClose.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; }

// Hàm Render Bảng và Thống kê
function renderTable() {
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";
    let active = 0, returned = 0;

    borrows.forEach(b => {
        if (b.status === "Đang mượn") active++;
        else returned++;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${b.borrowId}</td>
            <td>${b.borrowerName}</td>
            <td>${b.bookId}</td>
            <td>${b.borrowDate}</td>
            <td>${b.returnDate}</td>
            <td>${b.status}</td>
            <td>
                <button class="btn btn-warning" onclick="editBorrow('${b.borrowId}')">Sửa</button>
                <button class="btn btn-danger" onclick="deleteBorrow('${b.borrowId}')">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("totalBorrows").innerText = borrows.length;
    document.getElementById("activeBorrows").innerText = active;
    document.getElementById("returnedBorrows").innerText = returned;
}

// Hàm Xóa (Có xác nhận)
function deleteBorrow(id) {
    if (confirm("Bạn có chắc chắn muốn xóa phiếu mượn này?")) {
        borrows = borrows.filter(b => b.borrowId !== id);
        localStorage.setItem('borrows', JSON.stringify(borrows));
        renderTable();
    }
}

// Hàm Sửa (Đổ dữ liệu lên form)
function editBorrow(id) {
    const b = borrows.find(item => item.borrowId === id);
    if (b) {
        editMode = true;
        document.getElementById("borrowId").value = b.borrowId;
        document.getElementById("borrowId").disabled = true; // Không cho sửa ID
        document.getElementById("borrowerName").value = b.borrowerName;
        document.getElementById("bookId").value = b.bookId;
        document.getElementById("category").value = b.category;
        document.getElementById("borrowDate").value = b.borrowDate;
        document.getElementById("returnDate").value = b.returnDate;
        document.getElementById("phone").value = b.phone;
        document.getElementById("email").value = b.email;
        document.getElementById("status").value = b.status;
        document.getElementById("note").value = b.note;
        
        document.getElementById("modalTitle").innerText = "Sửa phiếu mượn";
        clearErrors();
        modal.style.display = "block";
    }
}

function showError(id, message) {
    document.getElementById(id).innerText = message;
}

function clearErrors() {
    document.querySelectorAll('.error').forEach(el => el.innerText = "");
}

// Xử lý Submit Form và Validation
form.onsubmit = function(e) {
    e.preventDefault();
    clearErrors();
    let isValid = true;

    const borrowId = document.getElementById("borrowId").value.trim();
    const borrowerName = document.getElementById("borrowerName").value.trim();
    const bookId = document.getElementById("bookId").value.trim();
    const category = document.getElementById("category").value;
    const borrowDate = document.getElementById("borrowDate").value;
    const returnDate = document.getElementById("returnDate").value;
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const status = document.getElementById("status").value;
    const note = document.getElementById("note").value.trim();

    // 1. Mã phiếu mượn
    if (!/^PM-\d+$/.test(borrowId)) {
        showError("errBorrowId", "Định dạng PM-XXXX (X là số)."); isValid = false;
    } else if (!editMode && borrows.some(b => b.borrowId === borrowId)) {
        showError("errBorrowId", "Mã phiếu đã tồn tại."); isValid = false;
    }

    // 2. Họ tên
    if (borrowerName.length < 2 || borrowerName.length > 40 || !/^[a-zA-ZÀ-ỹ\s]+$/.test(borrowerName)) {
        showError("errBorrowerName", "Từ 2-40 ký tự, chỉ chứa chữ cái và khoảng trắng."); isValid = false;
    }

    // 3. Mã sách
    if (!/^BK\d{5}$/.test(bookId)) {
        showError("errBookId", "Bắt đầu bằng BK và 5 chữ số."); isValid = false;
    }

    // 4. Thể loại
    if (category === "") { showError("errCategory", "Vui lòng chọn thể loại."); isValid = false; }

    // 5 & 6. Ngày mượn và Hạn trả
    const today = new Date().toISOString().split('T')[0];
    if (!borrowDate || borrowDate > today) {
        showError("errBorrowDate", "Không được lớn hơn ngày hiện tại."); isValid = false;
    }
    if (!returnDate || returnDate < borrowDate) {
        showError("errReturnDate", "Hạn trả phải lớn hơn hoặc bằng ngày mượn."); isValid = false;
    } else {
        const diffTime = Math.abs(new Date(returnDate) - new Date(borrowDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays > 30) {
            showError("errReturnDate", "Không vượt quá 30 ngày kể từ ngày mượn."); isValid = false;
        }
    }

    // 7. Số điện thoại
    if (!/^(03|05|07|08|09)\d{8}$/.test(phone)) {
        showError("errPhone", "Gồm 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09."); isValid = false;
    }

    // 8. Email
    if (!email || !email.endsWith("@library.vn")) {
        showError("errEmail", "Phải kết thúc bằng @library.vn."); isValid = false;
    }

    // 9. Trạng thái
    if (status === "") { showError("errStatus", "Vui lòng chọn trạng thái."); isValid = false; }

    // 10. Ghi chú
    if (note.length > 120) {
        showError("errNote", "Không vượt quá 120 ký tự."); isValid = false;
    }
    if (/<script|<iframe|<img/i.test(note)) {
        showError("errNote", "Không chứa thẻ HTML cơ bản."); isValid = false;
    }

    // Lưu dữ liệu nếu hợp lệ
    if (isValid) {
        const newData = { borrowId, borrowerName, bookId, category, borrowDate, returnDate, phone, email, status, note };
        
        if (editMode) {
            const index = borrows.findIndex(b => b.borrowId === borrowId);
            borrows[index] = newData;
        } else {
            borrows.push(newData);
        }

        localStorage.setItem('borrows', JSON.stringify(borrows));
        renderTable();
        modal.style.display = "none";
    }
}

// Khởi tạo bảng khi load trang
renderTable();