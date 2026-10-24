import oracledb

from app.core.database import get_connection


def save_chat(
    subject_id,
    question,
    answer,
    citations_json=None,
    confidence=None
):
    connection = get_connection()
    cursor = connection.cursor()

    message_id = cursor.var(oracledb.NUMBER)

    cursor.execute(
        """
        INSERT INTO chats_messages
        (
            subject_id,
            question,
            answer,
            citations_json,
            confidence
        )
        VALUES
        (
            :1,
            :2,
            :3,
            :4,
            :5
        )
        RETURNING id INTO :6
        """,
        (
            subject_id,
            question,
            answer,
            citations_json,
            confidence,
            message_id
        )
    )

    connection.commit()

    new_message_id = int(message_id.getvalue()[0])

    cursor.close()
    connection.close()

    return new_message_id


def save_feedback(
    message_id,
    helpful,
    feedback_comment=None
):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO feedback
        (
            message_id,
            helpful,
            feedback_comment
        )
        VALUES
        (
            :1,
            :2,
            :3
        )
        """,
        (
            message_id,
            helpful,
            feedback_comment
        )
    )

    connection.commit()

    cursor.close()
    connection.close()