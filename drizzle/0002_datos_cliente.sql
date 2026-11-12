ALTER TABLE `clientes` ADD `tipo_doc` text DEFAULT 'DNI' NOT NULL;--> statement-breakpoint
ALTER TABLE `clientes` ADD `domicilio` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `telefono` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `email` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `limite_credito` integer;