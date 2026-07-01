(function () {
    var GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx4I3CHnXHJI_H8iMCkKA5ZViN7-TEYnbmGaVuOrOCSycK6T1MyLPECYSyV3W36viEq/exec";
    var MAIL_TO = "info@endce.ru";

    var FORM_LABELS = {
        application: "Подать заявку",
        question: "Задать вопрос",
        feedback: "Форма обратной связи"
    };

    var SHEET_NAMES = {
        application: "Заявки",
        question: "Вопросы",
        feedback: "Обратная связь"
    };

    var SUBJECTS = {
        application: "Заявка с сайта ENDCE.RU",
        question: "Вопрос с сайта ENDCE.RU",
        feedback: "Заявка с сайта ENDCE.RU"
    };

    function getEndpoint() {
        var endpoint = window.ENDCE_LEADS_ENDPOINT || GOOGLE_SCRIPT_URL;
        endpoint = (endpoint || "").trim();
        if (!endpoint || endpoint.indexOf("PASTE_") === 0) return "";
        return endpoint;
    }

    function collectFields(form) {
        var fields = {};
        var formData = new FormData(form);

        formData.forEach(function (value, key) {
            fields[key] = (value || "").toString().trim();
        });

        return fields;
    }

    function buildPayload(form) {
        var formType = form.getAttribute("data-lead-form") || "feedback";
        var fields = collectFields(form);

        return {
            formType: formType,
            formLabel: FORM_LABELS[formType] || formType,
            sheetName: SHEET_NAMES[formType] || "Обращения",
            submittedAt: new Date().toISOString(),
            pageTitle: document.title,
            pageUrl: window.location.href,
            name: fields.name || "",
            phone: fields.phone || "",
            email: fields.email || "",
            service: fields.service || "",
            message: fields.message || "",
            question: fields.question || ""
        };
    }

    function buildMailLines(payload) {
        return [
            "Тип обращения: " + payload.formLabel,
            "Страница: " + payload.pageTitle,
            "URL: " + payload.pageUrl,
            "Имя: " + payload.name,
            "Телефон: " + payload.phone,
            "Email: " + payload.email,
            payload.service ? "Направление: " + payload.service : "",
            payload.message ? "Сообщение: " + payload.message : "",
            payload.question ? "Вопрос: " + payload.question : ""
        ].filter(Boolean);
    }

    function sendMailFallback(payload) {
        var subject = SUBJECTS[payload.formType] || "Обращение с сайта ENDCE.RU";
        var body = buildMailLines(payload).join("\n");
        window.location.href = "mailto:" + MAIL_TO + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    }

    function getSubmitButton(form) {
        return form.querySelector('button[type="submit"]');
    }

    function setLoading(form, isLoading) {
        var button = getSubmitButton(form);
        if (!button) return;

        if (!button.getAttribute("data-original-html")) {
            button.setAttribute("data-original-html", button.innerHTML);
        }

        button.disabled = isLoading;
        button.innerHTML = isLoading
            ? '<i class="fas fa-spinner fa-spin"></i> Отправка...'
            : button.getAttribute("data-original-html");
    }

    function getStatus(form) {
        var status = form.querySelector("[data-form-status]");
        if (status) return status;

        status = document.createElement("p");
        status.setAttribute("data-form-status", "");
        status.setAttribute("role", "status");
        status.style.margin = "0";
        status.style.fontSize = "0.9rem";
        status.style.lineHeight = "1.45";

        form.appendChild(status);
        return status;
    }

    function setStatus(form, message, type) {
        var status = getStatus(form);
        var isFooter = form.classList.contains("feedback-form");

        status.textContent = message;
        if (type === "error") {
            status.style.color = isFooter ? "#ffd7d7" : "#b42318";
        } else if (type === "success") {
            status.style.color = isFooter ? "#d9f7e7" : "#1f7a45";
        } else {
            status.style.color = isFooter ? "#ffffff" : "#25313d";
        }
    }

    function submitToGoogle(endpoint, payload) {
        return fetch(endpoint, {
            method: "POST",
            mode: "no-cors",
            keepalive: true,
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(payload)
        });
    }

    function handleSubmit(form) {
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        var payload = buildPayload(form);
        var endpoint = getEndpoint();

        if (!endpoint) {
            sendMailFallback(payload);
            setStatus(form, "Откроется почтовый клиент для отправки обращения.", "info");
            return;
        }

        setLoading(form, true);
        setStatus(form, "Отправляем обращение...", "info");

        submitToGoogle(endpoint, payload)
            .then(function () {
                form.reset();
                setStatus(form, "Обращение отправлено. Мы свяжемся с вами.", "success");
            })
            .catch(function () {
                setStatus(form, "Не удалось отправить в таблицу. Открываем письмо как резервный способ.", "error");
                sendMailFallback(payload);
            })
            .finally(function () {
                setLoading(form, false);
            });
    }

    document.addEventListener("submit", function (event) {
        var form = event.target;
        if (!form || !form.matches("[data-lead-form]")) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        handleSubmit(form);
    }, true);
})();
