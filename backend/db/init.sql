CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_role_id FOREIGN KEY (role_id) REFERENCES roles (role_id)
);




CREATE TABLE permissions (
    permission_id SERIAL PRIMARY KEY,
    permission_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);
CREATE TABLE vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    registration_number VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    fuel_cost_loaded DECIMAL(10, 2) NOT NULL,
    fuel_cost_unloaded DECIMAL(10, 2) NOT NULL
);
CREATE TABLE sts (
    sts_id SERIAL PRIMARY KEY,
    ward_number INT NOT NULL,
    capacity INT NOT NULL,
    gps_coordinates VARCHAR(100) NOT NULL
);
CREATE TABLE sts_managers (
    manager_id SERIAL PRIMARY KEY,
    sts_id INT NOT NULL,
    user_id INT NOT NULL,
    FOREIGN KEY (sts_id) REFERENCES sts(sts_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE TABLE sts_trucks (
    sts_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    FOREIGN KEY (sts_id) REFERENCES sts(sts_id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    PRIMARY KEY (sts_id, vehicle_id)
);
CREATE TABLE landfill_sites (
    landfill_id SERIAL PRIMARY KEY,
    capacity INT NOT NULL,
    operational_timespan VARCHAR(100) NOT NULL,
    gps_coordinates VARCHAR(100) NOT NULL
);
CREATE TABLE landfill_managers (
    manager_id SERIAL PRIMARY KEY,
    landfill_id INT NOT NULL,
    user_id INT NOT NULL,
    FOREIGN KEY (landfill_id) REFERENCES landfill_sites(landfill_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE landfill_truck_dumping_entries (
    entry_id SERIAL PRIMARY KEY,
    landfill_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    weight_of_waste DECIMAL(10, 2) NOT NULL,
    arrival_time TIMESTAMP NOT NULL,
    departure_time TIMESTAMP NOT NULL,
    FOREIGN KEY (landfill_id) REFERENCES landfill_sites(landfill_id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE
);

CREATE TABLE sts_truck_dumping_entries (
    entry_id SERIAL PRIMARY KEY,
    sts_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    weight_of_waste DECIMAL(10, 2) NOT NULL,
    arrival_time TIMESTAMP NOT NULL,
    departure_time TIMESTAMP NOT NULL,
    FOREIGN KEY (sts_id) REFERENCES sts(sts_id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE
);


INSERT INTO roles (role_name) VALUES ('System Admin');
INSERT INTO roles (role_name) VALUES ('STS Manager');
INSERT INTO roles (role_name) VALUES ('Landfill Manager');
INSERT INTO roles (role_name) VALUES ('Unassigned');

CREATE OR REPLACE FUNCTION delete_manager_on_role_change()
RETURNS TRIGGER AS
$$
BEGIN
    -- Check if the role_id is being updated
    IF OLD.role_id IS DISTINCT FROM NEW.role_id THEN
        -- Check if the user is a manager of STS
        IF EXISTS (SELECT 1 FROM sts_managers WHERE user_id = NEW.user_id) THEN
            -- Delete the entry from sts_managers
            DELETE FROM sts_managers WHERE user_id = NEW.user_id;
        END IF;
        
        -- Check if the user is a manager of landfill
        IF EXISTS (SELECT 1 FROM landfill_managers WHERE user_id = NEW.user_id) THEN
            -- Delete the entry from landfill_managers
            DELETE FROM landfill_managers WHERE user_id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER role_change_trigger
BEFORE UPDATE OF role_id ON users
FOR EACH ROW
EXECUTE FUNCTION delete_manager_on_role_change();

ALTER TABLE landfill_truck_dumping_entries
ALTER COLUMN arrival_time DROP NOT NULL,
ALTER COLUMN departure_time DROP NOT NULL;
ALTER TABLE sts_truck_dumping_entries
ALTER COLUMN arrival_time DROP NOT NULL,
ALTER COLUMN departure_time DROP NOT NULL;