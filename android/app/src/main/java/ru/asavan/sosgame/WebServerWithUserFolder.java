package ru.asavan.sosgame;

import static ru.asavan.sosgame.AndroidWebServerActivity.MAIN_LOG_TAG;

import android.content.Context;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.util.Log;

import android.content.ContentResolver;
import android.database.Cursor;

import java.io.FileNotFoundException;
import java.io.InputStream;



import androidx.annotation.NonNull;

abstract public class WebServerWithUserFolder extends WebServer implements ISetTreeServer {

    private volatile Uri baseTreeUri;

    public synchronized void setBaseTreeUri(Uri baseTreeUri) {
        this.baseTreeUri = baseTreeUri;
    }

    public WebServerWithUserFolder(Context context, int port) {
        super(context, port);
    }

    @NonNull
    @Override
    protected Response getResponse(String file) {
        Uri currentUri = this.baseTreeUri;
        if (currentUri != null) {
            Log.i(MAIN_LOG_TAG, "serve user content");
            try {
                InputStream is = getInputStreamFromFile(currentUri, file);
                var saf = getSafResource(currentUri, file);
                return newFixedLengthResponse(Response.Status.OK, getMimeTypeForFile(file), is, saf.size);
            } catch (Exception e) {
                // Любое исключение (FileNotFound, SecurityException) превращается в 404
                Log.w(MAIN_LOG_TAG, "External file not found: " + file);
            }
            return notFound();
        } else {
            Log.i(MAIN_LOG_TAG, "serve assets");
            return super.getResponse(file);
        }
    }

    /**
     * Метод находит файл в выбранной через OpenDocumentTree папке и возвращает открытый InputStream.
     * Вызывающий код ОБЯЗАН закрыть этот InputStream самостоятельно.
     */
    public InputStream getInputStreamFromFile(Uri treeUri, String relativePath) throws FileNotFoundException {
        // 1. Нормализуем путь (убираем лишние слэши)
        if (relativePath.startsWith("/")) {
            relativePath = relativePath.substring(1);
        }
        if (relativePath.endsWith("/")) {
            relativePath = relativePath.substring(0, relativePath.length() - 1);
        }

        if (relativePath.isEmpty()) {
            throw new FileNotFoundException("Путь к файлу пуст");
        }

        String[] pathSegments = relativePath.split("/");
        ContentResolver resolver = getContext().getContentResolver();

        // Стартуем с ID корневой папки (в вашем случае система вернет "primary:games/mastermind")
        String currentFolderDocId = DocumentsContract.getTreeDocumentId(treeUri);

        // Пошагово идем по сегментам пути
        for (int i = 0; i < pathSegments.length; i++) {
            String targetName = pathSegments[i];
            boolean isLastSegment = (i == pathSegments.length - 1);

            // Запрашиваем "детей" для текущей папки
            Uri childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, currentFolderDocId);

            String[] projection = new String[]{
                    DocumentsContract.Document.COLUMN_DISPLAY_NAME,
                    DocumentsContract.Document.COLUMN_DOCUMENT_ID,
                    DocumentsContract.Document.COLUMN_MIME_TYPE
            };

            String foundId = null;

            try (Cursor cursor = resolver.query(childrenUri, projection, null, null, null)) {
                if (cursor != null) {
                    int nameIndex = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_DISPLAY_NAME);
                    int idIndex = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_DOCUMENT_ID);
                    int mimeIndex = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_MIME_TYPE);

                    while (cursor.moveToNext()) {
                        String currentName = cursor.getString(nameIndex);
                        String mimeType = cursor.getString(mimeIndex);

                        if (targetName.equalsIgnoreCase(currentName)) {
                            if (isLastSegment) {
                                // Нашли финальный файл!
                                foundId = cursor.getString(idIndex);
                                break;
                            } else {
                                // Нашли промежуточную папку — проверяем тип директории
                                if (DocumentsContract.Document.MIME_TYPE_DIR.equals(mimeType)) {
                                    foundId = cursor.getString(idIndex);
                                    break;
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                Log.e("SAF_DEBUG", "Ошибка query() на элементе: " + targetName, e);
                throw new FileNotFoundException("Не удалось прочитать содержимое папки на шаге: " + targetName);
            }

            // Если ничего не нашли на текущем уровне — прерываем поиск
            if (foundId == null) {
                throw new FileNotFoundException("Файл или папка не найдены: " + targetName);
            }

            // Если это был последний сегмент, создаем URI для файла и открываем поток
            if (isLastSegment) {
                // Важно: foundId — это полный ID из системы ("primary:games/mastermind/app.webmanifest")
                // Метод buildDocumentUriUsingTree корректно добавит "/document/" и этот ID в URI
                Uri fileUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, foundId);

                Log.i(MAIN_LOG_TAG, "Document found: " + fileUri);

                InputStream stream = resolver.openInputStream(fileUri);
                if (stream == null) {
                    throw new FileNotFoundException("Система вернула null вместо InputStream для " + relativePath);
                }
                return stream;
            }

            // Если это папка, переключаем текущий ID и идем на следующий цикл
            currentFolderDocId = foundId;
        }

        throw new FileNotFoundException("Неизвестная ошибка при поиске: " + relativePath);
    }

    public SafResource getSafResource(Uri treeUri, String relativePath) throws FileNotFoundException {
        if (relativePath.startsWith("/")) {
            relativePath = relativePath.substring(1);
        }
        if (relativePath.endsWith("/")) {
            relativePath = relativePath.substring(0, relativePath.length() - 1);
        }

        if (relativePath.isEmpty()) {
            throw new FileNotFoundException("Путь к файлу пуст");
        }

        String[] pathSegments = relativePath.split("/");
        ContentResolver resolver = getContext().getContentResolver();
        String currentFolderDocId = DocumentsContract.getTreeDocumentId(treeUri);

        for (int i = 0; i < pathSegments.length; i++) {
            String targetName = pathSegments[i];
            boolean isLastSegment = (i == pathSegments.length - 1);

            Uri childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, currentFolderDocId);

            String[] projection = new String[]{
                    DocumentsContract.Document.COLUMN_DISPLAY_NAME,
                    DocumentsContract.Document.COLUMN_DOCUMENT_ID,
                    DocumentsContract.Document.COLUMN_MIME_TYPE,
                    DocumentsContract.Document.COLUMN_SIZE
            };

            String foundId = null;
            long fileSize = -1;

            try (Cursor cursor = resolver.query(childrenUri, projection, null, null, null)) {
                if (cursor != null) {
                    int nameIndex = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_DISPLAY_NAME);
                    int idIndex = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_DOCUMENT_ID);
                    int mimeIndex = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_MIME_TYPE);
                    int sizeIndex = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_SIZE);

                    while (cursor.moveToNext()) {
                        String currentName = cursor.getString(nameIndex);
                        String mimeType = cursor.getString(mimeIndex);

                        if (targetName.equalsIgnoreCase(currentName)) {
                            if (isLastSegment) {
                                foundId = cursor.getString(idIndex);
                                fileSize = cursor.getLong(sizeIndex);
                                break;
                            } else {
                                if (DocumentsContract.Document.MIME_TYPE_DIR.equals(mimeType)) {
                                    foundId = cursor.getString(idIndex);
                                    break;
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                Log.e("SAF_DEBUG", "Ошибка query() на элементе: " + targetName, e);
                throw new FileNotFoundException("Не удалось прочитать содержимое папки на шаге: " + targetName);
            }

            if (foundId == null) {
                throw new FileNotFoundException("Файл или папка не найдены: " + targetName);
            }

            if (isLastSegment) {
                // Используем только официальное API для построения URI
                Uri fileUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, foundId);

                InputStream stream = resolver.openInputStream(fileUri);
                if (stream == null) {
                    throw new FileNotFoundException("Система вернула null вместо InputStream для " + relativePath);
                }

                return new SafResource(stream, fileSize);
            }

            currentFolderDocId = foundId;
        }

        throw new FileNotFoundException("Неизвестная ошибка при поиске: " + relativePath);
    }
}
