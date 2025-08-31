-- CreateTable
CREATE TABLE "modelInput" (
    "id" SERIAL NOT NULL,
    "customer_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "click_events" INTEGER NOT NULL,
    "scroll_events" INTEGER NOT NULL,
    "touch_events" INTEGER NOT NULL,
    "keyboard_events" INTEGER NOT NULL,
    "device_motion" DOUBLE PRECISION NOT NULL,
    "time_on_page" INTEGER NOT NULL,
    "screen_size" TEXT NOT NULL,
    "browser_info" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "timezone_offset" INTEGER NOT NULL,
    "device_orientation" TEXT NOT NULL,
    "geolocation_city" TEXT NOT NULL,
    "transaction_amount" DOUBLE PRECISION NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "mouse_movement" INTEGER NOT NULL,
    "label" INTEGER NOT NULL,

    CONSTRAINT "modelInput_pkey" PRIMARY KEY ("id")
);
