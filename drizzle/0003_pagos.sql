CREATE TABLE `pagos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`creado` integer DEFAULT (unixepoch()) NOT NULL,
	`cliente_id` integer NOT NULL,
	`usuario_id` integer NOT NULL,
	`nombre_cliente` text NOT NULL,
	`nombre_usuario` text NOT NULL,
	`importe` integer NOT NULL,
	`medio` text NOT NULL,
	`observacion` text,
	`saldo_cliente` integer NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_movimientos_cuenta` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`creado` integer DEFAULT (unixepoch()) NOT NULL,
	`cliente_id` integer NOT NULL,
	`factura_id` integer,
	`pago_id` integer,
	`importe` integer NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`factura_id`) REFERENCES `facturas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pago_id`) REFERENCES `pagos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_movimientos_cuenta`("id", "creado", "cliente_id", "factura_id", "pago_id", "importe") SELECT "id", "creado", "cliente_id", "factura_id", NULL, "importe" FROM `movimientos_cuenta`;--> statement-breakpoint
DROP TABLE `movimientos_cuenta`;--> statement-breakpoint
ALTER TABLE `__new_movimientos_cuenta` RENAME TO `movimientos_cuenta`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `movimientos_cuenta_pago_id_unique` ON `movimientos_cuenta` (`pago_id`);