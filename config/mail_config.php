<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Adjusted paths since PHPMailer is now in vendor
require_once __DIR__ . '/../vendor/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/../vendor/PHPMailer/SMTP.php';
require_once __DIR__ . '/../vendor/PHPMailer/Exception.php';

function sendEmail($toEmail, $toName, $subject, $bodyContent) {
    $mail = new PHPMailer(true);

    try {
        // SMTP settings
        $mail->isSMTP();
        $mail->Host       = 'smtp.yourhost.com'; // e.g., mail.zidalco.com
        $mail->SMTPAuth   = true;
        $mail->Username   = 'info@zidalco.com'; // your SMTP user
        $mail->Password   = 'your-password';    // your SMTP password
        $mail->SMTPSecure = 'tls';              // or 'ssl'
        $mail->Port       = 587;                // or 465

        // Sender and recipients
        $mail->setFrom('info@zidalco.com', 'Zidalco Contact');

        // 4 Internal emails
        $mail->addAddress('suzy@zidalco.com', 'Suzy');
        $mail->addAddress('dalila@zidalco.com', 'Dalila');
        $mail->addAddress('frank@zidalco.com', 'Frank');
        $mail->addAddress('info@zidalco.com', 'Info');

        // Optional: send confirmation to user
        if ($toEmail) {
            $mail->addReplyTo($toEmail, $toName);
            $mail->addAddress($toEmail, $toName);
        }

        // Email content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $bodyContent;

        $mail->send();
        return true;

    } catch (Exception $e) {
        error_log("Mail Error: " . $mail->ErrorInfo);
        return false;
    }
}
