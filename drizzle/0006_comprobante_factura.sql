ALTER TABLE `factura_items` ADD `codigo_producto` text;--> statement-breakpoint
ALTER TABLE `facturas` ADD `nombre_vendedor` text;--> statement-breakpoint
ALTER TABLE `facturas` ADD `tipo_doc_cliente` text;--> statement-breakpoint
ALTER TABLE `facturas` ADD `documento_cliente` text;--> statement-breakpoint
ALTER TABLE `facturas` ADD `domicilio_cliente` text;--> statement-breakpoint
ALTER TABLE `facturas` ADD `saldo_cliente_venta` integer;